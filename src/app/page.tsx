　"use client";

import { useEffect, useMemo, useState } from "react";

type EventItem = {
  date: string;
  title: string;
  time: string;
  sortDate: string;
};

const STORAGE_KEY = "chavez-events";

function formatJP(date: Date, includeYear: boolean) {
  if (includeYear) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
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

function getWeekdayNumber(raw: string): number | null {
  if (raw.includes("日曜")) return 0;
  if (raw.includes("月曜")) return 1;
  if (raw.includes("火曜")) return 2;
  if (raw.includes("水曜")) return 3;
  if (raw.includes("木曜")) return 4;
  if (raw.includes("金曜")) return 5;
  if (raw.includes("土曜")) return 6;
  return null;
}

function getThisWeekday(base: Date, target: number) {
  const current = base.getDay();
  const diff = target - current;
  return addDays(base, diff);
}

function getNextWeekday(base: Date, target: number, weekOffset: number) {
  const current = base.getDay();
  let diff = target - current;
  if (diff <= 0) diff += 7;
  diff += (weekOffset - 1) * 7;
  return addDays(base, diff);
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
    const currentYear = today.getFullYear();

    const setDate = (d: Date) => {
      const includeYear = d.getFullYear() !== currentYear;
      date = formatJP(d, includeYear);
      sortDate = formatISO(d);
    };

    // ===== 明示日付 =====
    const fullYearMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!date && fullYearMatch) {
      const y = Number(fullYearMatch[1]);
      const m = Number(fullYearMatch[2]);
      const d = Number(fullYearMatch[3]);
      setDate(new Date(y, m - 1, d));
      raw = raw.replace(fullYearMatch[0], "");
    }

    const monthDayMatch = raw.match(/(\d{1,2})月(\d{1,2})日/);
    if (!date && monthDayMatch) {
      const y = currentYear;
      const m = Number(monthDayMatch[1]);
      const d = Number(monthDayMatch[2]);
      setDate(new Date(y, m - 1, d));
      raw = raw.replace(monthDayMatch[0], "");
    }

    // ===== 今日系 =====
    if (!date && raw.includes("今日")) {
      setDate(today);
      raw = raw.replace("今日", "");
    }

    if (!date && raw.includes("明日")) {
      setDate(addDays(today, 1));
      raw = raw.replace("明日", "");
    }

    if (!date && raw.includes("明後日")) {
      setDate(addDays(today, 2));
      raw = raw.replace("明後日", "");
    }

    if (!date && raw.includes("明々後日")) {
      setDate(addDays(today, 3));
      raw = raw.replace("明々後日", "");
    }

    // ===== 1〜100日後 =====
    const daysMatch = raw.match(/(\d{1,3})日後/);
    if (!date && daysMatch) {
      const d = Number(daysMatch[1]);
      if (d >= 1 && d <= 100) {
        setDate(addDays(today, d));
        raw = raw.replace(daysMatch[0], "");
      }
    }

    // ===== 時間 =====
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
    setList(list.filter((item) => item !== target));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <h1 className="text-4xl font-bold">チャベス</h1>

      <input
        className="w-80 rounded border bg-white px-3 py-2 text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: 明々後日 バイト"
      />

      <button onClick={handleClick} className="rounded bg-white px-4 py-2 text-black">
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

            <button
              onClick={() => handleDelete(index)}
              className="bg-red-500 px-2"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}