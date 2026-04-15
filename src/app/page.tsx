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

    // ===== ここが重要（順番と正規表現） =====
    if (!date && raw.match(/明々後日/)) {
      setDate(addDays(today, 3));
      raw = raw.replace(/明々後日/, "");
    }

    else if (!date && raw.match(/明後日/)) {
      setDate(addDays(today, 2));
      raw = raw.replace(/明後日/, "");
    }

    else if (!date && raw.match(/明日/)) {
      setDate(addDays(today, 1));
      raw = raw.replace(/明日/, "");
    }

    else if (!date && raw.match(/今日/)) {
      setDate(today);
      raw = raw.replace(/今日/, "");
    }

    // ===== 時間 =====
    const timeMatch = raw.match(/(\d{1,2})時/);
    if (timeMatch) {
      time = `${timeMatch[1].padStart(2, "0")}:00`;
      raw = raw.replace(timeMatch[0], "");
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <input
        className="text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={handleClick} className="bg-white text-black px-2">
        登録
      </button>

      {preview && (
        <div>
          <p>{preview.date} {preview.title}</p>
          <button onClick={handleConfirm}>OK</button>
        </div>
      )}

      {sortedList.map((item, i) => (
        <p key={i}>{item.date} {item.title}</p>
      ))}
    </div>
  );
}