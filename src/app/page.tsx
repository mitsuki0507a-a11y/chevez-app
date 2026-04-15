"use client";

import { useEffect, useMemo, useState } from "react";

type EventItem = {
  date: string;
  title: string;
  time: string;
  sortDate: string;
};

const STORAGE_KEY = "chavez-events";

function formatJP(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(base: Date, years: number) {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export default function Home() {
  const [text, setText] = useState("");
  const [list, setList] = useState<EventItem[]>([]);
  const [preview, setPreview] = useState<EventItem | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setList(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const aDateTime = `${a.sortDate}T${a.time || "23:59"}`;
      const bDateTime = `${b.sortDate}T${b.time || "23:59"}`;
      return new Date(aDateTime).getTime() - new Date(bDateTime).getTime();
    });
  }, [list]);

  const parseText = (input: string): EventItem => {
    let raw = input.trim();

    let date = "";
    let time = "";
    let title = "";
    let sortDate = formatISO(new Date());

    const today = new Date();

    const setDateFromDate = (d: Date) => {
      date = formatJP(d);
      sortDate = formatISO(d);
    };

    // 今日・明日系
    if (raw.includes("今日")) {
      setDateFromDate(today);
      raw = raw.replace("今日", "");
    }

    if (raw.includes("明日")) {
      setDateFromDate(addDays(today, 1));
      raw = raw.replace("明日", "");
    }

    if (raw.includes("明後日")) {
      setDateFromDate(addDays(today, 2));
      raw = raw.replace("明後日", "");
    }

    // ⭐ 1〜100日後
    const daysLaterMatch = raw.match(/(\d{1,3})日後/);
    if (daysLaterMatch) {
      const days = Number(daysLaterMatch[1]);
      if (days >= 1 && days <= 100) {
        setDateFromDate(addDays(today, days));
        raw = raw.replace(daysLaterMatch[0], "");
      }
    }

    // 来週
    if (raw.includes("来週")) {
      setDateFromDate(addDays(today, 7));
      raw = raw.replace("来週", "");
    }

    // 来月
    if (raw.includes("来月")) {
      setDateFromDate(addMonths(today, 1));
      raw = raw.replace("来月", "");
    }

    // 来年
    if (raw.includes("来年")) {
      setDateFromDate(addYears(today, 1));
      raw = raw.replace("来年", "");
    }

    // 時間
    if (raw.includes("朝")) {
      time = "09:00";
      raw = raw.replace("朝", "");
    }

    if (raw.includes("昼")) {
      time = "12:00";
      raw = raw.replace("昼", "");
    }

    if (raw.includes("夜")) {
      time = "20:00";
      raw = raw.replace("夜", "");
    }

    const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
      raw = raw.replace(timeMatch[0], "");
    } else {
      const hourMatch = raw.match(/(\d{1,2})時/);
      if (hourMatch) {
        time = `${hourMatch[1].padStart(2, "0")}:00`;
        raw = raw.replace(hourMatch[0], "");
      }
    }

    title = raw.trim();

    return { date, title, time, sortDate };
  };

  const handleClick = () => {
    if (!text) return;
    setPreview(parseText(text));
  };

  const handleConfirm = () => {
    if (!preview) return;
    setList([...list, preview]);
    setPreview(null);
    setText("");
  };

  const handleDelete = (index: number) => {
    const target = sortedList[index];
    setList(list.filter(item => item !== target));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <h1 className="text-4xl font-bold">チャベス</h1>

      <input
        className="w-80 rounded border bg-white px-3 py-2 text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: 3日後バイト / 50日後旅行"
      />

      <button onClick={handleClick} className="bg-white px-4 py-2 text-black rounded">
        登録
      </button>

      {preview && (
        <div className="border p-4">
          <p>これで登録しますか？</p>
          <p>{preview.date} {preview.title} {preview.time}</p>

          <button onClick={handleConfirm} className="bg-green-500 px-2 m-1">
            OK
          </button>

          <button onClick={() => setPreview(null)} className="bg-red-500 px-2 m-1">
            キャンセル
          </button>
        </div>
      )}

      <div>
        {sortedList.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <p>{item.date} {item.title} {item.time}</p>
            <button onClick={() => handleDelete(index)} className="bg-red-500 px-2">
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}