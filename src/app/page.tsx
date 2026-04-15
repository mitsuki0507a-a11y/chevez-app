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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
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
    if (saved) {
      setList(JSON.parse(saved));
    }
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

    const slashFullMatch = raw.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (!date && slashFullMatch) {
      const y = Number(slashFullMatch[1]);
      const m = Number(slashFullMatch[2]);
      const d = Number(slashFullMatch[3]);
      setDate(new Date(y, m - 1, d));
      raw = raw.replace(slashFullMatch[0], "");
    }

    const slashMatch = raw.match(/(\d{1,2})\/(\d{1,2})/);
    if (!date && slashMatch) {
      const y = currentYear;
      const m = Number(slashMatch[1]);
      const d = Number(slashMatch[2]);
      setDate(new Date(y, m - 1, d));
      raw = raw.replace(slashMatch[0], "");
    }

    // ===== 今週 + 曜日 =====
    if (!date && raw.includes("今週")) {
      const weekday = getWeekdayNumber(raw);
      if (weekday !== null) {
        setDate(getThisWeekday(today, weekday));
        raw = raw.replace("今週", "");
        raw = raw.replace(/日曜|月曜|火曜|水曜|木曜|金曜|土曜/g, "");
      }
    }

    // ===== 再来週 + 曜日 =====
    if (!date && raw.includes("再来週")) {
      const weekday = getWeekdayNumber(raw);
      if (weekday !== null) {
        setDate(getNextWeekday(today, weekday, 2));
        raw = raw.replace("再来週", "");
        raw = raw.replace(/日曜|月曜|火曜|水曜|木曜|金曜|土曜/g, "");
      }
    }

    // ===== 来週 + 曜日 =====
    if (!date && raw.includes("来週")) {
      const weekday = getWeekdayNumber(raw);
      if (weekday !== null) {
        setDate(getNextWeekday(today, weekday, 1));
        raw = raw.replace("来週", "");
        raw = raw.replace(/日曜|月曜|火曜|水曜|木曜|金曜|土曜/g, "");
      }
    }

    // ===== 今日系（長い順）=====
    if (!date && /明々後日/.test(raw)) {
      setDate(addDays(today, 3));
      raw = raw.replace(/明々後日/g, "");
    } else if (!date && /明後日/.test(raw)) {
      setDate(addDays(today, 2));
      raw = raw.replace(/明後日/g, "");
    } else if (!date && /明日/.test(raw)) {
      setDate(addDays(today, 1));
      raw = raw.replace(/明日/g, "");
    } else if (!date && /今日/.test(raw)) {
      setDate(today);
      raw = raw.replace(/今日/g, "");
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

    // ===== 来月 / 再来月 =====
    if (!date && raw.includes("再来月")) {
      setDate(addMonths(today, 2));
      raw = raw.replace("再来月", "");
    } else if (!date && raw.includes("来月")) {
      setDate(addMonths(today, 1));
      raw = raw.replace("来月", "");
    }

    // ===== 1〜12ヶ月後 =====
    const monthLaterMatch = raw.match(/(\d{1,2})ヶ月後/);
    if (!date && monthLaterMatch) {
      const m = Number(monthLaterMatch[1]);
      if (m >= 1 && m <= 12) {
        setDate(addMonths(today, m));
        raw = raw.replace(monthLaterMatch[0], "");
      }
    }

    // ===== 年系 =====
    if (!date && raw.includes("再来年")) {
      setDate(addYears(today, 2));
      raw = raw.replace("再来年", "");
    } else if (!date && raw.includes("来年")) {
      setDate(addYears(today, 1));
      raw = raw.replace("来年", "");
    }

    const yearLaterMatch = raw.match(/(\d)年後/);
    if (!date && yearLaterMatch) {
      const y = Number(yearLaterMatch[1]);
      if (y >= 1 && y <= 3) {
        setDate(addYears(today, y));
        raw = raw.replace(yearLaterMatch[0], "");
      }
    }

    // ===== 時間 =====
    if (raw.includes("朝")) {
      time = "09:00";
      raw = raw.replace(/朝/g, "");
    }

    if (raw.includes("昼")) {
      time = "12:00";
      raw = raw.replace(/昼/g, "");
    }

    if (raw.includes("夕方")) {
      time = "17:00";
      raw = raw.replace(/夕方/g, "");
    }

    if (raw.includes("夜")) {
      time = "20:00";
      raw = raw.replace(/夜/g, "");
    }

    const ampmHourMatch = raw.match(/(午前|午後)(\d{1,2})時/);
    if (ampmHourMatch) {
      let hour = Number(ampmHourMatch[2]);
      if (ampmHourMatch[1] === "午後" && hour < 12) hour += 12;
      if (ampmHourMatch[1] === "午前" && hour === 12) hour = 0;
      time = `${String(hour).padStart(2, "0")}:00`;
      raw = raw.replace(ampmHourMatch[0], "");
    }

    const timeColonMatch = raw.match(/(\d{1,2}):(\d{2})/);
    if (timeColonMatch) {
      time = `${timeColonMatch[1].padStart(2, "0")}:${timeColonMatch[2]}`;
      raw = raw.replace(timeColonMatch[0], "");
    } else {
      const hourMinuteMatch = raw.match(/(\d{1,2})時(\d{1,2})分/);
      if (hourMinuteMatch) {
        time = `${hourMinuteMatch[1].padStart(2, "0")}:${hourMinuteMatch[2].padStart(2, "0")}`;
        raw = raw.replace(hourMinuteMatch[0], "");
      } else {
        const hourMatch = raw.match(/(\d{1,2})時/);
        if (hourMatch) {
          time = `${hourMatch[1].padStart(2, "0")}:00`;
          raw = raw.replace(hourMatch[0], "");
        }
      }
    }

    title = raw.trim();

    return { date, title, time, sortDate };
  };

  const handleClick = () => {
    if (!text.trim()) return;
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
    setList(
      list.filter(
        (item) =>
          !(
            item.date === target.date &&
            item.title === target.title &&
            item.time === target.time &&
            item.sortDate === target.sortDate
          )
      )
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 py-8 text-white">
      <h1 className="text-4xl font-bold">チャベス</h1>

      <input
        className="w-80 rounded border bg-white px-3 py-2 text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: 明々後日バイト / 来年誕生日"
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