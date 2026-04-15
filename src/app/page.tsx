"use client";

import { useEffect, useState } from "react";

type EventItem = {
  date: string;
  title: string;
  time: string;
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

  const parseText = (input: string): EventItem => {
    let raw = input.trim();

    let date = "";
    let time = "";
    let title = "";

    const today = new Date();

    if (raw.includes("今日")) {
      date = `${today.getMonth() + 1}月${today.getDate()}日`;
      raw = raw.replace("今日", "");
    }

    if (raw.includes("明日")) {
      const d = new Date();
      d.setDate(today.getDate() + 1);
      date = `${d.getMonth() + 1}月${d.getDate()}日`;
      raw = raw.replace("明日", "");
    }

    if (raw.includes("明後日")) {
      const d = new Date();
      d.setDate(today.getDate() + 2);
      date = `${d.getMonth() + 1}月${d.getDate()}日`;
      raw = raw.replace("明後日", "");
    }

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

    const dateMatch = raw.match(/\d{1,2}\/\d{1,2}/);
    if (dateMatch) {
      const [m, d] = dateMatch[0].split("/");
      date = `${m}月${d}日`;
      raw = raw.replace(dateMatch[0], "");
    }

    const timeMatch = raw.match(/\d{1,2}:\d{2}/);
    if (timeMatch) {
      time = timeMatch[0];
      raw = raw.replace(timeMatch[0], "");
    } else {
      const hourMatch = raw.match(/(\d{1,2})時/);
      if (hourMatch) {
        const h = hourMatch[1].padStart(2, "0");
        time = `${h}:00`;
        raw = raw.replace(hourMatch[0], "");
      }
    }

    title = raw.trim();

    return { date, title, time };
  };

  const handleClick = () => {
    if (!text) return;
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
    const newList = list.filter((_, i) => i !== index);
    setList(newList);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <h1 className="text-4xl font-bold">チャベス</h1>

      <input
        className="w-80 rounded border bg-white px-3 py-2 text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: 明日 夜 バイト"
      />

      <button
        onClick={handleClick}
        className="rounded bg-white px-4 py-2 text-black"
      >
        登録
      </button>

      {preview && (
        <div className="border p-4">
          <p>これで登録しますか？</p>
          <p>
            {preview.date} {preview.title} {preview.time}
          </p>

          <button
            onClick={handleConfirm}
            className="bg-green-500 px-2 m-1"
          >
            OK
          </button>

          <button
            onClick={() => setPreview(null)}
            className="bg-red-500 px-2 m-1"
          >
            キャンセル
          </button>
        </div>
      )}

      <div>
        {list.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between w-80 border p-2"
          >
            <p>
              {item.date} {item.title} {item.time}
            </p>

            <button
              onClick={() => handleDelete(index)}
              className="bg-red-500 px-2 py-1"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}