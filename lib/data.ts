import { Event, TravelSignal } from "./types";

export const EVENTS: Event[] = [
  {
    id: "evt-001",
    title: "Crop Over Grand Kadooment",
    summary:
      "The biggest day of Barbados's Crop Over festival — costumed bands parade through Bridgetown to the Spring Garden Highway. Expect massive energy, soca anthems, and tens of thousands on the road.",
    location: "Spring Garden Highway, Bridgetown, Barbados",
    date: "2026-08-03T08:00:00Z",
    category: "soca",
    poster_url: "https://picsum.photos/seed/kadooment/400/300",
    event_link: "https://cropover.com/kadooment",
    tickets_required: false,
    ticket_note: "Free public event — no tickets needed. Roads close from 6am.",
    sources: [
      {
        type: "radio",
        name: "VOB 92.9 FM",
        timestamp: "2026-07-30T14:00:00Z",
        excerpt:
          "VOB confirms all eighteen registered bands will parade on Monday for Grand Kadooment.",
      },
      {
        type: "newspaper",
        name: "Barbados Nation",
        timestamp: "2026-07-31T08:00:00Z",
        excerpt:
          "Nation reports record band registrations ahead of this year's Kadooment Day parade.",
      },
    ],
    confidence: {
      label: "high",
      reason: "Confirmed by two independent sources including official radio.",
    },
  },
  {
    id: "evt-002",
    title: "Soca Monarch Finals",
    summary:
      "The annual competition crowning the Power and Groovy Soca Monarchs of Barbados. Held at the Kensington Oval, this is one of the most-attended events of the Crop Over season.",
    location: "Kensington Oval, Bridgetown, Barbados",
    date: "2026-07-26T20:00:00Z",
    category: "soca",
    poster_url: "https://picsum.photos/seed/socamonarch/400/300",
    event_link: "https://cropover.com/soca-monarch",
    tickets_required: true,
    ticket_note: "Tickets from $60 BBD. Available at the Oval box office or online via Caribticket.",
    sources: [
      {
        type: "radio",
        name: "HOTT 95.3 FM",
        timestamp: "2026-07-25T10:00:00Z",
        excerpt: "HOTT 95.3 announces final lineup for Soca Monarch — twelve Power and eight Groovy acts confirmed.",
      },
    ],
    confidence: {
      label: "high",
      reason: "Official broadcast media confirmation with full lineup details.",
    },
  },
  {
    id: "evt-003",
    title: "Oistins Fish Fry",
    summary:
      "The legendary Friday night fish fry at Oistins Bay Garden. Fresh grilled fish, live music, and a festive street-party atmosphere that draws both locals and visitors every week.",
    location: "Oistins Bay Garden, Christ Church, Barbados",
    date: "2026-08-01T18:00:00Z",
    category: "beach",
    poster_url: undefined,
    event_link: undefined,
    tickets_required: false,
    ticket_note: "No tickets — pay per dish at the stalls.",
    sources: [
      {
        type: "tiktok",
        name: "TikTok mentions",
        timestamp: "2026-07-31T20:00:00Z",
        excerpt:
          "Multiple TikTok creators posted about the Oistins fish fry this week, flagging it as a must-do.",
      },
      {
        type: "newspaper",
        name: "Barbados Today",
        timestamp: "2026-07-29T09:00:00Z",
        excerpt: "Barbados Today's weekend guide recommends the Oistins fish fry as a top Friday-night activity.",
      },
    ],
    confidence: {
      label: "medium",
      reason: "Recurring weekly event confirmed by social signals and press — no official notice this week.",
    },
  },
  {
    id: "evt-004",
    title: "Reggae on the Hill",
    summary:
      "An outdoor reggae concert at Farley Hill National Park featuring regional acts. Picnic-style seating on the hillside with views across the Scotland District.",
    location: "Farley Hill National Park, St. Peter, Barbados",
    date: "2026-08-08T16:00:00Z",
    category: "music",
    poster_url: "https://picsum.photos/seed/reggaehill/400/300",
    event_link: "https://caribticket.com/reggae-on-the-hill",
    tickets_required: true,
    ticket_note: "Tickets from $80 BBD. Buy via Caribticket or at the gate on the day.",
    sources: [
      {
        type: "newspaper",
        name: "Barbados Nation",
        timestamp: "2026-07-28T11:00:00Z",
        excerpt: "Nation Arts & Entertainment section previews Reggae on the Hill with confirmed headliner from Jamaica.",
      },
    ],
    confidence: {
      label: "high",
      reason: "Confirmed with full lineup by major daily newspaper.",
    },
  },
  {
    id: "evt-005",
    title: "Holetown Festival Market",
    summary:
      "A week-long heritage market celebrating the first European settlement in Barbados. Craft stalls, local food vendors, and cultural performances at the beachside festival village.",
    location: "Holetown, St. James, Barbados",
    date: "2026-08-10T10:00:00Z",
    category: "market",
    poster_url: undefined,
    event_link: undefined,
    tickets_required: false,
    ticket_note: "Free entry. Individual stall purchases only.",
    sources: [
      {
        type: "radio",
        name: "CBC Radio 900 AM",
        timestamp: "2026-08-01T07:00:00Z",
        excerpt: "CBC Radio mentions preparations underway for the annual Holetown Festival, starting 10 August.",
      },
    ],
    confidence: {
      label: "medium",
      reason: "Single radio mention; no official programme announced yet.",
    },
  },
  {
    id: "evt-006",
    title: "Caribbean Culture Summit",
    summary:
      "A two-day conference at the Lloyd Erskine Sandiford Centre exploring Caribbean creative industries, digital culture, and diaspora identity. Panel discussions, workshops, and an evening showcase.",
    location: "Lloyd Erskine Sandiford Centre, Two Mile Hill, Barbados",
    date: "2026-08-14T09:00:00Z",
    category: "culture",
    poster_url: "https://picsum.photos/seed/culturesummit/400/300",
    event_link: "https://caribbeanculturesummit.com/2026",
    tickets_required: true,
    ticket_note: "Full conference pass $150 BBD. Day passes available. Register at the link.",
    sources: [
      {
        type: "newspaper",
        name: "Caribbean Beat",
        timestamp: "2026-07-20T10:00:00Z",
        excerpt: "Caribbean Beat profiles the inaugural Caribbean Culture Summit, noting confirmed speakers from six territories.",
      },
      {
        type: "tiktok",
        name: "TikTok mentions",
        timestamp: "2026-07-30T16:00:00Z",
        excerpt: "Several Caribbean creatives posting about the Summit on TikTok, using #CaribbeanCultureSummit.",
      },
    ],
    confidence: {
      label: "high",
      reason: "Multiple cross-platform sources with confirmed programming details.",
    },
  },
  {
    id: "evt-007",
    title: "Bathsheba Surf Classic",
    summary:
      "Annual longboard surf competition at the wild Atlantic coast of Bathsheba, where Soup Bowl waves draw competitors from across the Caribbean. Spectator-friendly with food vendors on the beach.",
    location: "Soup Bowl, Bathsheba, St. Joseph, Barbados",
    date: "2026-08-15T07:00:00Z",
    category: "beach",
    poster_url: "https://picsum.photos/seed/surfclassic/400/300",
    event_link: undefined,
    tickets_required: false,
    ticket_note: "Free to watch from the beach.",
    sources: [
      {
        type: "tiktok",
        name: "TikTok mentions",
        timestamp: "2026-07-29T18:00:00Z",
        excerpt: "Surf community TikToks referencing the Bathsheba event, but no official poster circulating yet.",
      },
    ],
    confidence: {
      label: "low",
      reason: "Only informal social mentions — no official confirmation or programme found.",
    },
  },
  {
    id: "evt-008",
    title: "Bridgetown After Dark",
    summary:
      "A night market in the UNESCO-listed Bridgetown city centre — food stalls, DJs, and artisan vendors take over Broad Street after hours. Rumoured to be a new monthly fixture.",
    location: "Broad Street, Bridgetown, Barbados",
    date: "2026-08-05T19:00:00Z",
    category: "market",
    poster_url: undefined,
    event_link: undefined,
    tickets_required: false,
    ticket_note: "Free entry. Individual vendor purchases.",
    sources: [
      {
        type: "tiktok",
        name: "TikTok mentions",
        timestamp: "2026-07-31T21:00:00Z",
        excerpt: "Circulating TikTok story mentions a 'Bridgetown night market' on 5 August — no official source identified.",
      },
    ],
    confidence: {
      label: "needs_review",
      reason: "Single unverified TikTok claim. No radio, newspaper, or official confirmation found.",
    },
  },
  {
    id: "evt-009",
    title: "Gospelfest Barbados",
    summary:
      "Multi-day international gospel music festival held at the National Stadium, featuring acts from the USA, UK, Nigeria, and across the Caribbean. One of the Caribbean's premier gospel events.",
    location: "National Stadium, Waterford, Barbados",
    date: "2026-08-20T18:00:00Z",
    category: "music",
    poster_url: "https://picsum.photos/seed/gospelfest/400/300",
    event_link: "https://gospelfestbarbados.com",
    tickets_required: true,
    ticket_note: "Tickets from $40 BBD per night. Full festival passes available. Book at gospelfestbarbados.com.",
    sources: [
      {
        type: "radio",
        name: "VOB 92.9 FM",
        timestamp: "2026-07-26T08:00:00Z",
        excerpt: "VOB interviews the Gospelfest director — confirms international headliners and full programme.",
      },
      {
        type: "newspaper",
        name: "Barbados Nation",
        timestamp: "2026-07-27T09:00:00Z",
        excerpt: "Nation features full Gospelfest lineup preview including US and Nigerian headliners.",
      },
    ],
    confidence: {
      label: "high",
      reason: "Director interview on national radio and full press preview in major daily.",
    },
  },
  {
    id: "evt-010",
    title: "St. Lawrence Gap Street Party",
    summary:
      "Informal weekly gathering along the St. Lawrence Gap strip in Christ Church. Multiple bars, live DJs, and the area's signature atmosphere drawing a mixed local and tourist crowd.",
    location: "St. Lawrence Gap, Christ Church, Barbados",
    date: "2026-08-02T21:00:00Z",
    category: "soca",
    poster_url: undefined,
    event_link: undefined,
    tickets_required: false,
    ticket_note: "No tickets. Bar entry and drink purchases only.",
    sources: [
      {
        type: "tiktok",
        name: "TikTok mentions",
        timestamp: "2026-07-30T22:00:00Z",
        excerpt: "Regular TikTok coverage of The Gap at night — consistent mentions of Saturday street-party atmosphere.",
      },
    ],
    confidence: {
      label: "medium",
      reason: "Recurring informal event corroborated by consistent social signal patterns.",
    },
  },
];

export const TRAVEL_SIGNALS: TravelSignal[] = [
  {
    id: "trv-001",
    headline: "Route 4 delayed near Warrens roundabout",
    detail: "Buses running approximately 20 minutes late northbound due to road works on Highway 2.",
    source: "Barbados Transport Board",
    timestamp: "2026-08-01T09:15:00Z",
  },
  {
    id: "trv-002",
    headline: "Adams-Barrow-Cummins Highway closed (southbound)",
    detail: "ABC Highway southbound closed between Wildey and Graeme Hall. Divert via Highway 7.",
    source: "Ministry of Transport & Works",
    timestamp: "2026-08-01T07:45:00Z",
  },
  {
    id: "trv-003",
    headline: "Barbados Ferry service operating normally",
    detail: "Express services to Port of Spain and Bridgetown Harbour running on schedule today.",
    source: "Barbados Port Authority",
    timestamp: "2026-08-01T06:00:00Z",
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  soca: "#EF9F27",
  beach: "#1D9E75",
  music: "#7F77DD",
  culture: "#D4537E",
  market: "#D85A30",
};

export const CATEGORY_LABELS: Record<string, string> = {
  soca: "Soca",
  beach: "Beach",
  music: "Music",
  culture: "Culture",
  market: "Market",
};
