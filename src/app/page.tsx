"use client";

import { useEffect, useMemo, useState } from "react";

type EventItem = {
  date: string;
  title: string;
  time: string;
  sortDate: string; // YYYY-MM-DD
};

const STORAGE_KEY = "chavez-events";

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

  const formatJP = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

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

    // 今日
    if (raw.includes("今日")) {
      setDateFromDate(today);
      raw = raw.replace("今日", "");
    }

    // 明日
    if (raw.includes("明日")) {
      const d = new Date();
      d.setDate(today.getDate() + 1);
      setDateFromDate(d);
      raw = raw.replace("明日", "");
    }

    // 明後日
    if (raw.includes("明後日")) {
      const d = new Date();
      d.setDate(today.getDate() + 2);
      setDateFromDate(d);
      raw = raw.replace("明後日", "");
    }

    // 1〜10日後
    for (let i = 1; i <= 10; i++) {
      if (raw.includes(`${i}日後`)) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        setDateFromDate(d);
        raw = raw.replace(`${i}日後`, "");
      }
    }

    // 来週
    if (raw.includes("来週")) {
      const d = new Date();
      d.setDate(today.getDate() + 7);
      setDateFromDate(d);
      raw = raw.replace("来週", "");
    }

    // 来月
    if (raw.includes("来月")) {
      const d = new Date();
      d.setMonth(today.getMonth() + 1);
      setDateFromDate(d);
      raw = raw.replace("来月", "");
    }

    // ○年○月○日
    const fullDateMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (fullDateMatch) {
      const year = Number(fullDateMatch[1]);
      const month = Number(fullDateMatch[2]);
      const day = Number(fullDateMatch[3]);
      const d = new Date(year, month - 1, day);
      setDateFromDate(d);
      raw = raw.replace(fullDateMatch[0], "");
    }

    // ○月○日（今年）
    const monthDayMatch = raw.match(/(\d{1,2})月(\d{1,2})日/);
    if (monthDayMatch) {
      const year = today.getFullYear();
      const month = Number(monthDayMatch[1]);
      const day = Number(monthDayMatch[2]);
      const d = new Date(year, month - 1, day);
      setDateFromDate(d);
      raw = raw.replace(monthDayMatch[0], "");
    }

    // 4/20（今年）
    const slashMatch = raw.match(/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
      const year = today.getFullYear();
      const month = Number(slashMatch[1]);
      const day = Number(slashMatch[2]);
      const d = new Date(year, month - 1, day);
      setDateFromDate(d);
      raw = raw.replace(slashMatch[0], "");
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
      const h = timeMatch[1].padStart(2, "0");
      const m = timeMatch[2];
      time = `${h}:${m}`;
      raw = raw.replace(timeMatch[0], "");
    } else {
      const hourMinuteJPMatch = raw.match(/(\d{1,2})時(\d{1,2})分/);
      if (hourMinuteJPMatch) {
        const h = hourMinuteJPMatch[1].padStart(2, "0");
        const m = hourMinuteJPMatch[2].padStart(2, "0");
        time = `${h}:${m}`;
        raw = raw.replace(hourMinuteJPMatch[0], "");
      } else {
        const hourMatch = raw.match(/(\d{1,2})時/);
        if (hourMatch) {
          const h = hourMatch[1].padStart(2, "0");
          time = `${h}:00`;
          raw = raw.replace(hourMatch[0], "");
        }
      }
    }

    title = raw.trim();

    return { date, title, time, sortDate };
  };

  const handleClick = () => {
    if (!text.trim()) return;
    const parsed = parseText(text);
    setPreview(parsed);
  };

  const handleConfirm = () => {
    if (!preview) return;
    setList([...list, preview]);
    setPreview(null);
    setText("");
  };

  const handleDelete = (index: number) => {
    const target = sortedList[index];
    const newList = list.filter(
      (item) =>
        !(
          item.date === target.date &&
          item.title === target.title &&
          item.time === target.time &&
          item.sortDate === target.sortDate
        )
    );
    setList(newList);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 py-8 text-white">
      <h1 className="text-4xl font-bold">チャベス</h1>

      <input
        className="w-80 rounded border bg-white px-3 py-2 text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: 明日夜バイト / 4/20病院14:30"
      />

      <button
        onClick={handleClick}
        className="rounded bg-white px-4 py-2 text-black"
      >
        登録
      </button>

      {preview && (
        <div className="w-80 rounded border p-4">
          <p className="mb-2">これで登録しますか？</p>
          <p>
            {preview.date || "日付なし"} {preview.title} {preview.time}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleConfirm}
              className="rounded bg-green-500 px-3 py-1"
            >
              OK
            </button>

            <button
              onClick={() => setPreview(null)}
              className="rounded bg-red-500 px-3 py-1"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="flex w-80 flex-col gap-2">
        {sortedList.map((item, index) => (
          <div
            key={`${item.sortDate}-${item.time}-${item.title}-${index}`}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <p className="font-bold">{item.title || "名称なし"}</p>
              <p className="text-sm text-gray-300">
                {item.date || "日付なし"} {item.time || ""}
              </p>
            </div>

            <button
              onClick={() => handleDelete(index)}
              className="rounded bg-red-500 px-2 py-1"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}