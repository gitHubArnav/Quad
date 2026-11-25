"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { categories, clubs, majors } from "@/lib/clubs";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [category, setCategory] = useState("All clubs");
  const [major, setMajor] = useState("All majors");
  const [commitment, setCommitment] = useState("Any time commitment");
  const [selectivity, setSelectivity] = useState("Any selectivity");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Original order");
  const [tracked, setTracked] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [listLoaded, setListLoaded] = useState(false);
  const [calendarView, setCalendarView] = useState<"list" | "month">("list");
  const [calendarMonth, setCalendarMonth] = useState<Date | null>(null);

  useEffect(() => {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    try {
      const saved = window.localStorage.getItem("quad:saved-clubs");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setTracked(parsed);
        }
      }
      const savedNotes = window.localStorage.getItem("quad:club-notes");
      if (savedNotes) {
        const parsedNotes: unknown = JSON.parse(savedNotes);
        if (parsedNotes && typeof parsedNotes === "object" && !Array.isArray(parsedNotes)) {
          setNotes(parsedNotes as Record<string, string>);
        }
      }
    } catch {
      // Keep the page usable if browser storage is unavailable or malformed.
    }
    setListLoaded(true);
  }, []);

  useEffect(() => {
    if (listLoaded) window.localStorage.setItem("quad:saved-clubs", JSON.stringify(tracked));
  }, [tracked, listLoaded]);

  useEffect(() => {
    if (listLoaded) window.localStorage.setItem("quad:club-notes", JSON.stringify(notes));
  }, [notes, listLoaded]);

  const filteredClubs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = clubs.filter((club) => {
      const matchesCategory = category === "All clubs" || club.category === category;
      const matchesMajor = major === "All majors" || club.majors.includes(major);
      const matchesCommitment =
        commitment === "Any time commitment" ||
        (commitment === "1–3 hours" && club.commitment <= 3) ||
        (commitment === "4–6 hours" && club.commitment >= 4 && club.commitment <= 6) ||
        (commitment === "7+ hours" && club.commitment >= 7);
      const matchesSelectivity = selectivity === "Any selectivity" || club.selectivity === selectivity;
      const matchesSearch =
        !query ||
        `${club.name} ${club.category} ${club.description} ${club.majors.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesMajor && matchesCommitment && matchesSelectivity && matchesSearch;
    });
    if (sortBy === "Lowest time") return [...results].sort((a, b) => a.commitment - b.commitment);
    if (sortBy === "A–Z") return [...results].sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, [category, major, commitment, selectivity, search, sortBy]);

  function toggleTracked(id: string) {
    setTracked((current) =>
      current.includes(id) ? current.filter((clubId) => clubId !== id) : [...current, id],
    );
  }

  const trackedClubs = clubs.filter((club) => tracked.includes(club.id));
  const weeklyHours = trackedClubs.reduce((total, club) => total + club.commitment, 0);
  const quarterHours = weeklyHours * 10;
  const activeFilters = category !== "All clubs" || major !== "All majors" || commitment !== "Any time commitment" || selectivity !== "Any selectivity" || search.trim() !== "";
  const relatedClubs = clubs.filter((club) => !tracked.includes(club.id) && trackedClubs.some((saved) =>
    club.category === saved.category || club.majors.some((item) => saved.majors.includes(item)),
  )).slice(0, 3);
  const calendarEvents = trackedClubs
    .flatMap((club) => club.events.map((event) => ({ ...event, club: club.name })))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const monthDays = useMemo(() => {
    if (!calendarMonth) return [];
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return { date, key: dateKey(date), inMonth: date.getMonth() === calendarMonth.getMonth() };
    });
  }, [calendarMonth]);

  function downloadCalendar() {
    const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
    const entries = calendarEvents.map((event, index) => {
      const start = `${event.date.replaceAll("-", "")}T${event.time.replace(":", "")}00`;
      const endDate = new Date(`${event.date}T${event.time}:00`);
      endDate.setMinutes(endDate.getMinutes() + 30);
      const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
      return [
        "BEGIN:VEVENT",
        `UID:${event.date}-${event.time}-${index}@quad.local`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(event.title)} · ${escapeIcs(event.club)}`,
        "END:VEVENT",
      ].join("\r\n");
    });
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Quad//Club Calendar//EN", ...entries, "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "quad-club-calendar.ics";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a href="#explore" className="wordmark" aria-label="Quad home">quad</a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#explore">Explore</a>
          <a href="#calendar">Calendar</a>
          <a href="#applications">My list <span className="nav-count">{tracked.length}</span></a>
        </nav>
        <span className="ucla-label">UCLA / STUDENT CLUBS</span>
      </header>

      <section className="explore-section" id="explore">
        <div className="section-heading">
          <div>
            <p className="eyebrow">UCLA / CLUB DIRECTORY</p>
            <h2>Explore clubs</h2>
          </div>
        </div>

        <div className="explore-layout">
          <aside className="filters" aria-label="Club filters">
            <label className="search-label" htmlFor="club-search">Search</label>
            <input
              id="club-search"
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Club, interest, or major"
            />

            <label htmlFor="major-filter">Your major</label>
            <select id="major-filter" value={major} onChange={(event) => setMajor(event.target.value)}>
              {majors.map((item) => <option key={item}>{item}</option>)}
            </select>

            <label htmlFor="commitment-filter">Time commitment</label>
            <select id="commitment-filter" value={commitment} onChange={(event) => setCommitment(event.target.value)}>
              {["Any time commitment", "1–3 hours", "4–6 hours", "7+ hours"].map((item) => <option key={item}>{item}</option>)}
            </select>

            <label htmlFor="selectivity-filter">Selectivity</label>
            <select id="selectivity-filter" value={selectivity} onChange={(event) => setSelectivity(event.target.value)}>
              {["Any selectivity", "Open membership", "Application"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <p className="filter-help">Application clubs use a selection process. Open membership clubs welcome students without one.</p>
          </aside>

          <div className="results">
            <div className="category-row" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`category-button${category === item ? " is-active" : ""}`}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="results-meta" aria-live="polite">
              <span>{filteredClubs.length} {filteredClubs.length === 1 ? "club" : "clubs"}</span>
              {major !== "All majors" && <span>Related to {major}</span>}
              <label className="sort-control" htmlFor="club-sort">Sort
                <select id="club-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  {["Original order", "Lowest time", "A–Z"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            {activeFilters && <button className="reset-filters" type="button" onClick={() => { setCategory("All clubs"); setMajor("All majors"); setCommitment("Any time commitment"); setSelectivity("Any selectivity"); setSearch(""); }}>Reset filters</button>}

            {filteredClubs.length > 0 ? (
              <div className="club-grid">
                {filteredClubs.map((club) => (
                  <article className="club-card" key={club.id}>
                    <Link href={`/clubs/${club.id}`} className="club-card-link" aria-label={`View ${club.name} information`}>
                      {club.logoUrl && <Image className="club-logo" src={club.logoUrl} alt={`${club.name} logo`} width={48} height={48} unoptimized />}
                      <span className="club-card-category">{club.category}</span>
                      <h3>{club.name}</h3>
                      {club.description && <p className="club-card-description">{club.description}</p>}
                      <div className="club-card-facts">
                        <span>{club.commitment} hrs / week · {club.commitment * 10} hrs / quarter</span>
                        <span title={club.selectivity === "Application" ? "Joining requires completing the club's application process." : "Students can join without a selection process."}>{club.selectivity}</span>
                        <span>{club.recruitingWindow || "Recruiting timing not provided"}</span>
                      </div>
                      <span className="club-card-open">Club information <span aria-hidden="true">↗</span></span>
                    </Link>
                    {club.website && <a className="club-card-website" href={club.website} target="_blank" rel="noreferrer">Club website ↗</a>}
                    <button
                      type="button"
                      className={`track-button${tracked.includes(club.id) ? " is-tracked" : ""}`}
                      onClick={() => toggleTracked(club.id)}
                    >
                      {tracked.includes(club.id) ? "Added to list ✓" : "Add to list +"}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No clubs match those filters. Try changing a filter or search term.</p>
            )}
          </div>
        </div>
      </section>

      <section className="lower-sections">
        <section id="calendar" className="calendar-section">
          <div className="calendar-heading">
            <div>
              <p className="eyebrow">DATES FOR CLUBS YOU TRACK</p>
              <h2>Calendar</h2>
            </div>
            <div className="calendar-actions">
              <div className="view-switch" aria-label="Calendar view">
                <button type="button" aria-pressed={calendarView === "list"} className={calendarView === "list" ? "selected" : ""} onClick={() => setCalendarView("list")}>Up next</button>
                <button type="button" aria-pressed={calendarView === "month"} className={calendarView === "month" ? "selected" : ""} onClick={() => setCalendarView("month")}>Month</button>
              </div>
              <button type="button" className={`export-button${calendarEvents.length ? " is-ready" : ""}`} onClick={downloadCalendar} disabled={!calendarEvents.length} title={!calendarEvents.length ? "Export will be available when saved clubs have event dates." : "Download saved-club dates for Apple Calendar or Google Calendar."}>Export .ics</button>
            </div>
          </div>
          <p className="calendar-help">{trackedClubs.length ? "No synced dates yet. Check club information for application details." : "Add clubs to your list and their dates will appear here when available."}</p>
          {calendarView === "list" ? (
            calendarEvents.length ? (
              <div className="event-list">
                {calendarEvents.map((event, index) => (
                  <article className="event-row" key={`${event.club}-${event.title}-${index}`}>
                    <span className="event-day">{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</span>
                    <span className="event-time">{new Date(`${event.date}T${event.time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    <div><strong>{event.title}</strong><span>{event.club}</span></div>
                    <span className="event-arrow">↗</span>
                  </article>
                ))}
              </div>
            ) : <p className="empty-list">No upcoming dates for your saved clubs.</p>
          ) : (
            <div className="month-view">
              <div className="month-toolbar">
                <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth((month) => month ? new Date(month.getFullYear(), month.getMonth() - 1, 1) : month)}>←</button>
                <strong>{calendarMonth?.toLocaleDateString("en-US", { month: "long", year: "numeric" }) || "Loading calendar…"}</strong>
                <button type="button" aria-label="Next month" onClick={() => setCalendarMonth((month) => month ? new Date(month.getFullYear(), month.getMonth() + 1, 1) : month)}>→</button>
              </div>
              {!calendarEvents.length && <p className="empty-list">No saved-club dates this month. Dates appear here when clubs provide them.</p>}
              <div className="month-grid">
                {weekdayLabels.map((label) => <div className="month-weekday" key={label}>{label}</div>)}
                {monthDays.map((day) => (
                  <div className={`month-day${day.inMonth ? "" : " outside-month"}`} key={day.key}>
                    <span className="month-date">{day.date.getDate()}</span>
                  <div className="month-day-events">
                    {calendarEvents.filter((event) => event.date === day.key).map((event, index) => (
                      <article className="month-event" key={`${event.club}-${event.title}-${index}`} title={`${event.title} — ${event.club}`}>
                        <strong>{event.title}</strong><small>{event.club}</small>
                      </article>
                    ))}
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section id="applications" className="applications-section">
          <p className="eyebrow">SAVED CLUBS</p>
          <h2>My list</h2>
          <p className="list-storage-note">Your clubs and notes save in this browser.</p>
          {trackedClubs.length > 0 && <div className="load-summary"><strong>{weeklyHours} hrs / week</strong><span>About {quarterHours} hours over a 10-week quarter</span>{weeklyHours >= 11 && <p>You have {weeklyHours}+ hours per week across saved clubs. Check that the schedule works for you.</p>}</div>}
          {trackedClubs.length ? (
            <ul className="tracked-list">
              {trackedClubs.map((club) => (
                <li key={club.id}>
                  <div className="saved-club-content">
                    <div className="saved-club-heading"><Link href={`/clubs/${club.id}`}>{club.name}</Link><button type="button" onClick={() => toggleTracked(club.id)}>Remove</button></div>
                    <label className="note-label" htmlFor={`club-note-${club.id}`}>My note</label>
                    <textarea id={`club-note-${club.id}`} value={notes[club.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [club.id]: event.target.value }))} placeholder="Add a reminder or a question for this club" rows={2} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-list">Add clubs from the directory to keep them together here.</p>
          )}
          {relatedClubs.length > 0 && <section className="related-section" aria-label="Related clubs"><h3>Related clubs</h3><p>Based on clubs in your list.</p>{relatedClubs.map((club) => <div className="related-row" key={club.id}><Link href={`/clubs/${club.id}`}>{club.name}</Link><button type="button" onClick={() => toggleTracked(club.id)}>Add +</button></div>)}</section>}
        </section>
      </section>

      <footer className="footer"><span>QUAD</span><span>UCLA · CLUB DIRECTORY</span></footer>
    </main>
  );
}
