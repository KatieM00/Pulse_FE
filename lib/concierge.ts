import { EVENTS } from "./data";
import { Event, ChatMessage } from "./types";

// Today anchor for "today" queries — use a fixed date close to the dummy data
const TODAY = new Date("2026-08-01T12:00:00Z");

function todaysEvents(): Event[] {
  return EVENTS.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === TODAY.getFullYear() &&
      d.getMonth() === TODAY.getMonth() &&
      d.getDate() === TODAY.getDate()
    );
  });
}

function upcomingEvents(days = 7): Event[] {
  const cutoff = new Date(TODAY.getTime() + days * 86400000);
  return EVENTS.filter((e) => {
    const d = new Date(e.date);
    return d >= TODAY && d <= cutoff;
  });
}

function eventsByCategory(cat: string): Event[] {
  return EVENTS.filter((e) => e.category.toLowerCase() === cat.toLowerCase());
}

function findEventByKeyword(q: string): Event | undefined {
  const lower = q.toLowerCase();
  return EVENTS.find(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.location.toLowerCase().includes(lower) ||
      e.summary.toLowerCase().includes(lower)
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-BB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ConciergeResult {
  text: string;
  events?: Event[];
}

export function getConciergeResponse(query: string): ConciergeResult {
  const q = query.toLowerCase().trim();

  // --- "what's on today" ---
  if (q.includes("today") || q.includes("tonight") || q.includes("on today")) {
    const events = todaysEvents();
    const upcoming = upcomingEvents(3);
    const show = events.length > 0 ? events : upcoming;
    const label = events.length > 0 ? "today" : "the next few days";
    return {
      text:
        show.length > 0
          ? `Here's what I'm picking up for ${label} across the Caribbean. These are pulled from radio, news, and social signals — tap any event for the full details.`
          : "I don't have any confirmed events today yet. Things are still being picked up from radio and news feeds — check back soon.",
      events: show,
    };
  }

  // --- tickets ---
  if (q.includes("ticket") || q.includes("book") || q.includes("pay") || q.includes("cost")) {
    const mentioned = findEventByKeyword(q);
    if (mentioned) {
      const ticketInfo = mentioned.tickets_required
        ? `${mentioned.title} does require tickets — ${mentioned.ticket_note}.`
        : `${mentioned.title} is free to attend — ${mentioned.ticket_note}.`;
      return {
        text: ticketInfo,
        events: [mentioned],
      };
    }
    // Generic
    const ticketed = EVENTS.filter((e) => e.tickets_required);
    return {
      text: `Most free events in Barbados just need you to show up — no registration required. For ticketed events, Caribticket is the main platform. Here are the events that need tickets:`,
      events: ticketed,
    };
  }

  // --- how to get there / transport / directions ---
  if (
    q.includes("get there") ||
    q.includes("how do i get") ||
    q.includes("transport") ||
    q.includes("directions") ||
    q.includes("bus") ||
    q.includes("taxi") ||
    q.includes("route")
  ) {
    const mentioned = findEventByKeyword(q);
    if (mentioned) {
      return {
        text: `To get to ${mentioned.title} at ${mentioned.location}: the Barbados Transport Board runs routes across the island — check the ZR vans on the main roads or take a yellow Transport Board bus. Taxis are widely available and most drivers know all the key venues. If you're heading to the Spring Garden Highway or Kensington Oval areas, there will be extra services running on event days.`,
        events: [mentioned],
      };
    }
    return {
      text:
        "Getting around Barbados is easiest by ZR van or yellow Transport Board bus — both run regularly across the island. Taxis are also plentiful, especially near Bridgetown and the south coast. For specific event venues, I can give you more details if you name the event.",
    };
  }

  // --- soca / music / beach / culture / market category ---
  for (const cat of ["soca", "music", "beach", "culture", "market"]) {
    if (q.includes(cat)) {
      const events = eventsByCategory(cat);
      return {
        text:
          events.length > 0
            ? `Here's what I've picked up for ${cat} events across the Caribbean right now:`
            : `I don't have any confirmed ${cat} events in my feed right now. Signals are still coming in — check back soon.`,
        events: events.length > 0 ? events : undefined,
      };
    }
  }

  // --- specific event name lookup ---
  const found = findEventByKeyword(q);
  if (found) {
    return {
      text: `Found it — here's what I know about ${found.title}:`,
      events: [found],
    };
  }

  // --- upcoming this week ---
  if (
    q.includes("this week") ||
    q.includes("weekend") ||
    q.includes("upcoming") ||
    q.includes("next")
  ) {
    const events = upcomingEvents(7);
    return {
      text: `Here's everything on my radar for the next seven days across the Caribbean:`,
      events,
    };
  }

  // --- fallback ---
  return {
    text:
      "I'm picking up signals from radio, newspapers, and social across the Caribbean. You can ask me things like 'What's on today?', 'How do I get tickets?', 'What's happening on the beach this weekend?', or name a specific event and I'll pull up what I know.",
  };
}

export function buildInitialMessages(query: string): ChatMessage[] {
  const userMsg: ChatMessage = {
    id: "msg-user-1",
    role: "user",
    text: query,
  };

  const result = getConciergeResponse(query);
  const assistantMsg: ChatMessage = {
    id: "msg-assistant-1",
    role: "assistant",
    text: result.text,
    events: result.events,
  };

  return [userMsg, assistantMsg];
}
