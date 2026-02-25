#!/usr/bin/env python3
"""Generate built-in HabitFlow sample import datasets.

Outputs JSON files in public/sample-data/ that match the app import schema.
"""

from __future__ import annotations

import json
import random
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any


TODAY = date(2026, 2, 25)
OUT_DIR = Path("public/sample-data")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def uid() -> str:
    return str(uuid.uuid4())


def iso_dt(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def iso_at(day: date, hour: int, minute: int) -> str:
    return iso_dt(datetime(day.year, day.month, day.day, hour, minute, tzinfo=timezone.utc))


def ymd(day: date) -> str:
    return day.isoformat()


def dow_sun0(day: date) -> int:
    # Python Monday=0..Sunday=6 -> app expects Sunday=0..Saturday=6
    return (day.weekday() + 1) % 7


def scheduled_for(habit: dict[str, Any], day: date) -> bool:
    freq = habit["frequency"]
    dow = dow_sun0(day)
    if freq == "daily":
        return True
    if freq == "weekdays":
        return dow not in (0, 6)
    if freq == "weekends":
        return dow in (0, 6)
    if freq == "specific_days":
        return dow in habit.get("targetDays", [])
    if freq == "x_per_week":
        return True
    return False


@dataclass(frozen=True)
class HabitTemplate:
    name: str
    icon: str
    color: str
    frequency: str
    category: str
    reminder_time: str | None = None
    description: str | None = None
    target_days: list[int] | None = None
    target_count: int | None = None
    archived: bool = False
    start_date: date | None = None
    end_date: date | None = None


STARTER_TEMPLATES = [
    HabitTemplate("Morning Walk", "🚶", "#10b981", "daily", "Health", "07:30", "20-minute walk after coffee"),
    HabitTemplate("Read 20 Minutes", "📚", "#3b82f6", "daily", "Learning", "21:00", "Read before bed"),
    HabitTemplate("Strength Training", "🏋️", "#ef4444", "specific_days", "Fitness", "18:00", "Mon/Wed/Fri", [1, 3, 5]),
    HabitTemplate("Meditation", "🧘", "#8b5cf6", "weekdays", "Mindset", "08:00", "10 minutes breathing"),
    HabitTemplate("Meal Prep", "🥗", "#14b8a6", "weekends", "Health", "11:00", "Prep lunches for the week"),
]


POWER_USER_TEMPLATES = [
    HabitTemplate("Morning Walk", "🚶", "#10b981", "daily", "Health", "07:00", "Outdoor walk"),
    HabitTemplate("Read 20 Minutes", "📚", "#3b82f6", "daily", "Learning", "21:00", "Reading habit"),
    HabitTemplate("Meditation", "🧘", "#8b5cf6", "weekdays", "Mindset", "08:00", "Mindfulness"),
    HabitTemplate("Strength Training", "🏋️", "#ef4444", "specific_days", "Fitness", "18:00", "Mon/Wed/Fri lifts", [1, 3, 5]),
    HabitTemplate("Stretching", "🧎", "#f97316", "daily", "Mobility", "06:45", "Mobility flow"),
    HabitTemplate("Meal Prep", "🥗", "#14b8a6", "weekends", "Health", "11:00", "Weekend prep"),
    HabitTemplate("Practice Guitar", "🎸", "#f59e0b", "x_per_week", "Creative", "20:30", "15 min minimum", target_count=4),
    HabitTemplate("Language Practice", "🗣️", "#06b6d4", "specific_days", "Learning", "12:30", "Spanish lessons", [0, 2, 4, 6]),
    HabitTemplate("Journal", "✍️", "#ec4899", "daily", "Mindset", "22:00", "3 lines minimum"),
    HabitTemplate("Inbox Zero", "📥", "#0ea5e9", "weekdays", "Work", "16:30", "Email cleanup"),
    HabitTemplate("Budget Check-in", "💸", "#84cc16", "x_per_week", "Admin", "19:00", "Review spending", target_count=2),
    HabitTemplate("Call Family", "📞", "#a855f7", "specific_days", "Relationships", "17:30", "Sunday call", [0]),
    HabitTemplate("Deep Work Block", "🧠", "#2563eb", "weekdays", "Work", "09:30", "90-minute focus sprint"),
    HabitTemplate("Protein Goal", "🥚", "#f43f5e", "daily", "Health", "20:00", "Hit protein target"),
    HabitTemplate("Drink Water", "💧", "#22c55e", "daily", "Health", "10:00", "Stay hydrated"),
    HabitTemplate("Sleep Before 11", "😴", "#6366f1", "daily", "Recovery", "22:15", "Wind down routine"),
    HabitTemplate("Run / Cardio", "🏃", "#0ea5e9", "specific_days", "Fitness", "07:15", "Tue/Thu/Sat cardio", [2, 4, 6]),
    HabitTemplate("Plan Tomorrow", "🗓️", "#f59e0b", "weekdays", "Planning", "21:30", "Set top 3 tasks"),
    HabitTemplate("Desk Cleanup", "🧽", "#a3a3a3", "weekdays", "Environment", "17:45", "2-minute reset"),
    HabitTemplate("Practice Typing", "⌨️", "#38bdf8", "x_per_week", "Learning", "13:30", "Typing drills", target_count=3),
    HabitTemplate("No Sugar Dessert", "🍰", "#fb7185", "daily", "Nutrition", "20:45", "Avoid sweets"),
    HabitTemplate("Sunlight Break", "☀️", "#eab308", "weekdays", "Health", "12:00", "Get outside midday"),
    HabitTemplate("Review Goals", "🎯", "#9333ea", "specific_days", "Planning", "19:30", "Mon/Thu review", [1, 4]),
    HabitTemplate("Creative Sketch", "✏️", "#f97316", "x_per_week", "Creative", "18:30", "Sketchbook session", target_count=2),
    HabitTemplate("Cold Shower Challenge", "🧊", "#64748b", "daily", "Challenge", None, "Completed challenge", archived=True, start_date=date(2025, 9, 1), end_date=date(2025, 9, 30)),
    HabitTemplate("Job Search Applications", "💼", "#059669", "x_per_week", "Career", "14:00", "Send applications", target_count=5, archived=True, start_date=date(2025, 8, 1), end_date=date(2025, 11, 30)),
]


def habit_rate(name: str) -> float:
    rates = {
        "Morning Walk": 0.74,
        "Read 20 Minutes": 0.68,
        "Meditation": 0.62,
        "Strength Training": 0.70,
        "Stretching": 0.72,
        "Meal Prep": 0.80,
        "Practice Guitar": 0.58,
        "Language Practice": 0.66,
        "Journal": 0.63,
        "Inbox Zero": 0.55,
        "Budget Check-in": 0.52,
        "Call Family": 0.83,
        "Deep Work Block": 0.61,
        "Protein Goal": 0.65,
        "Drink Water": 0.77,
        "Sleep Before 11": 0.57,
        "Run / Cardio": 0.64,
        "Plan Tomorrow": 0.60,
        "Desk Cleanup": 0.67,
        "Practice Typing": 0.51,
        "No Sugar Dessert": 0.54,
        "Sunlight Break": 0.59,
        "Review Goals": 0.73,
        "Creative Sketch": 0.49,
        "Cold Shower Challenge": 0.87,
        "Job Search Applications": 0.46,
    }
    return rates.get(name, 0.6)


def build_habits(templates: list[HabitTemplate], created_base: datetime) -> list[dict[str, Any]]:
    habits: list[dict[str, Any]] = []
    for i, t in enumerate(templates):
        created = created_base + timedelta(days=i)
        item: dict[str, Any] = {
            "id": uid(),
            "name": t.name,
            "icon": t.icon,
            "color": t.color,
            "frequency": t.frequency,
            "category": t.category,
            "sortOrder": i,
            "isArchived": t.archived,
            "createdAt": iso_dt(created),
            "updatedAt": iso_dt(created + timedelta(days=120)),
        }
        if t.description:
            item["description"] = t.description
        if t.reminder_time:
            item["reminderTime"] = t.reminder_time
        if t.target_days is not None:
            item["targetDays"] = t.target_days
        if t.target_count is not None:
            item["targetCount"] = t.target_count
        habits.append(item)
    return habits


def build_completions(
    habits: list[dict[str, Any]],
    templates: dict[str, HabitTemplate],
    start: date,
    end: date,
    seed: int,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    completions: list[dict[str, Any]] = []

    for habit in habits:
        template = templates[habit["name"]]
        d = start
        bias = 0.0
        while d <= end:
            if not scheduled_for(habit, d):
                d += timedelta(days=1)
                continue

            if template.start_date and d < template.start_date:
                d += timedelta(days=1)
                continue
            if template.end_date and d > template.end_date:
                d += timedelta(days=1)
                continue

            p = habit_rate(habit["name"])

            # Gentle recency improvement
            if d >= end - timedelta(days=45):
                p += 0.06
            elif d <= start + timedelta(days=30):
                p -= 0.02

            # January slump to make charts interesting
            if date(2026, 1, 8) <= d <= date(2026, 1, 16):
                p -= 0.10

            dow = dow_sun0(d)
            if habit["name"] in {"Practice Guitar", "Creative Sketch"} and dow in (0, 6):
                p += 0.10
            if habit["name"] == "Inbox Zero" and dow in (5, 6):
                p -= 0.15
            if habit["name"] in {"Journal", "Read 20 Minutes"} and dow in (0, 6):
                p += 0.03

            p = max(0.10, min(0.96, p + bias))
            done = rng.random() < p

            if done:
                hour = rng.choice([6, 7, 8, 12, 17, 18, 19, 20, 21, 22])
                minute = rng.choice([0, 5, 10, 15, 20, 30, 40, 45, 50])
                comp: dict[str, Any] = {
                    "id": uid(),
                    "habitId": habit["id"],
                    "date": ymd(d),
                    "completedAt": iso_at(d, hour, minute),
                }
                if habit["name"] in {"Journal", "Read 20 Minutes", "Budget Check-in"} and rng.random() < 0.06:
                    notes = {
                        "Journal": ["Good reset today", "Low energy but showed up", "Short entry, still counts"],
                        "Read 20 Minutes": ["Finished a chapter", "Read before bed", "Nonfiction notes"],
                        "Budget Check-in": ["Reviewed groceries", "Updated budget categories", "Caught a duplicate charge"],
                    }
                    comp["note"] = rng.choice(notes[habit["name"]])
                completions.append(comp)
                bias = min(0.03, bias + 0.0025)
            else:
                bias = max(-0.02, bias - 0.0035)

            d += timedelta(days=1)

    completions.sort(key=lambda c: (c["date"], c["habitId"]))
    return completions


def make_payload(
    *,
    templates: list[HabitTemplate],
    days: int,
    seed: int,
    theme: str = "system",
    week_starts_on: int = 1,
) -> dict[str, Any]:
    now = datetime(2026, 2, 25, 15, 30, tzinfo=timezone.utc)
    created_base = datetime(2025, 8, 15, 12, 0, tzinfo=timezone.utc)
    habits = build_habits(templates, created_base)
    template_map = {t.name: t for t in templates}
    start = TODAY - timedelta(days=days)
    completions = build_completions(habits, template_map, start, TODAY, seed)

    return {
        "version": "1.0",
        "exportedAt": iso_dt(now),
        "app": "HabitFlow",
        "data": {
            "habits": habits,
            "completions": completions,
            "settings": {
                "id": "user_settings",
                "theme": theme,
                "weekStartsOn": week_starts_on,
                "showStreaks": True,
                "showCompletionRate": True,
                "defaultView": "today",
                "createdAt": iso_dt(created_base),
                "updatedAt": iso_dt(now),
            },
        },
    }


def write_payload(filename: str, payload: dict[str, Any]) -> None:
    path = OUT_DIR / filename
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"{path}: {len(payload['data']['habits'])} habits, "
        f"{len(payload['data']['completions'])} completions"
    )


def main() -> None:
    write_payload(
        "habitflow-sample-starter.json",
        make_payload(templates=STARTER_TEMPLATES, days=35, seed=11),
    )
    write_payload(
        "habitflow-sample-power-user.json",
        make_payload(templates=POWER_USER_TEMPLATES, days=370, seed=29),
    )


if __name__ == "__main__":
    main()
