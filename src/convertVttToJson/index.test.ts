import { convertVttToJson } from ".";

describe(convertVttToJson.name, () => {
  test("parses simplest possible WebVTT file", async () => {
    const actual = await convertVttToJson("WEBVTT");

    expect(actual).toHaveLength(0);
    expect(actual).toEqual([]);
  });

  test("parses very simple WebVTT file with a text header", async () => {
    const actual = await convertVttToJson("WEBVTT - This file has no cues.");

    expect(actual).toHaveLength(0);
    expect(actual).toEqual([]);
  });

  test("parses common WebVTT example with a header and 3 cues", async () => {
    const actual = await convertVttToJson(`
WEBVTT - This file has cues.

14
00:01:14.815 --> 00:01:18.114
- What?
- Where are we now?

15
00:01:18.171 --> 00:01:20.991
- This is big bat country.

16
00:01:21.058 --> 00:01:23.868
- [ Bats Screeching ]
- They won't get in your hair. They're after the bugs.
`);

    expect(actual).toHaveLength(3);

    expect(actual).toEqual([
      {
        start: 74_815,
        end: 78_114,
        part: "- What? - Where are we now?",
        words: [
          { word: "-" },
          { word: "what" },
          { word: "-" },
          { word: "where" },
          { word: "are" },
          { word: "we" },
          { word: "now" },
        ],
      },
      {
        start: 78_171,
        end: 80_991,
        part: "- This is big bat country.",
        words: [
          { word: "-" },
          { word: "this" },
          { word: "is" },
          { word: "big" },
          { word: "bat" },
          { word: "country" },
        ],
      },
      {
        start: 81_058,
        end: 83_868,
        part:
          "- [ Bats Screeching ] - They won't get in your hair. They're after the bugs.",
        words: [
          { word: "-" },
          { word: "bats" },
          { word: "screeching" },
          { word: "-" },
          { word: "they" },
          { word: "won't" },
          { word: "get" },
          { word: "in" },
          { word: "your" },
          { word: "hair" },
          { word: "they're" },
          { word: "after" },
          { word: "the" },
          { word: "bugs" },
        ],
      },
    ]);
  });

  test("skips NOTE usage", async () => {
    const actual = await convertVttToJson(`
WEBVTT - Translation of that film I like

NOTE
This translation was done by Kyle so that
some friends can watch it with their parents.

1
00:02:15.000 --> 00:02:20.000
- Ta en kopp varmt te.
- Det är inte varmt.

2
00:02:20.000 --> 00:02:25.000
- Har en kopp te.
- Det smakar som te.

NOTE This last line may not translate well.

3
00:02:25.000 --> 00:02:30.000
- Ta en kopp
    `);

    expect(actual).toHaveLength(3);

    expect(actual).toEqual([
      {
        start: 135_000,
        end: 140_000,
        part: "- Ta en kopp varmt te.",
        words: [
          { word: "-" },
          { word: "ta" },
          { word: "en" },
          { word: "kopp" },
          { word: "varmt" },
          { word: "te" },
        ],
      },
      {
        start: 135_000,
        end: 140_000,
        part: "- Det är inte varmt. 2",
        words: [
          { word: "-" },
          { word: "det" },
          { word: "är" },
          { word: "inte" },
          { word: "varmt" },
          { word: "2" },
        ],
      },
      {
        start: 140_000,
        end: 145_000,
        part: "- Har en kopp te. - Det smakar som te.",
        words: [
          { word: "-" },
          { word: "har" },
          { word: "en" },
          { word: "kopp" },
          { word: "te" },
          { word: "-" },
          { word: "det" },
          { word: "smakar" },
          { word: "som" },
          { word: "te" },
        ],
      },
    ]);
  });

  test("skips STYLE usage", async () => {
    const actual = await convertVttToJson(`
WEBVTT

STYLE
::cue {
    background-image: linear-gradient(to bottom, dimgray, lightgray);
    color: papayawhip;
}
/* Style blocks cannot use blank lines nor "dash dash greater than" */

NOTE comment blocks can be used between style blocks.

STYLE
::cue(b) {
    color: peachpuff;
}

00:00:00.000 --> 00:00:10.000
- Hello <b>world</b>.

NOTE style blocks cannot appear after the first cue.
`);

    expect(actual).toHaveLength(1);

    expect(actual).toEqual([
      {
        start: 0,
        end: 10_000,
        part: "- Hello world.",
        words: [{ word: "-" }, { word: "hello" }, { word: "world" }],
      },
    ]);
  });

  test("filters out the positioning of text tracks", async () => {
    const actual = await convertVttToJson(`
WEBVTT

00:00:00.000 --> 00:00:04.000 position:10%,line-left align:left size:35%
Where did he go?

00:00:03.000 --> 00:00:06.500 position:90% align:right size:35%
I think he went down this lane.

00:00:04.000 --> 00:00:06.500 position:45%,line-right align:center size:35%
What are you waiting for?
`);

    expect(actual).toHaveLength(3);

    expect(actual).toEqual([
      {
        start: 0,
        end: 4_000,
        part: "Where did he go?",
        words: [
          { word: "where" },
          { word: "did" },
          { word: "he" },
          { word: "go" },
        ],
      },
      {
        start: 3_000,
        end: 6_500,
        part: "I think he went down this lane.",
        words: [
          { word: "i" },
          { word: "think" },
          { word: "he" },
          { word: "went" },
          { word: "down" },
          { word: "this" },
          { word: "lane" },
        ],
      },
      {
        start: 4_000,
        end: 6_500,
        part: "What are you waiting for?",
        words: [
          { word: "what" },
          { word: "are" },
          { word: "you" },
          { word: "waiting" },
          { word: "for" },
        ],
      },
    ]);
  });

  test("supports identifiers", async () => {
    const actual = await convertVttToJson(`
WEBVTT

1
00:00:22.230 --> 00:00:24.606
This is the first subtitle.

2
00:00:30.739 --> 00:00:34.074
This is the second.

3
00:00:34.159 --> 00:00:35.743
Third
`);

    expect(actual).toHaveLength(3);

    expect(actual).toEqual([
      {
        start: 22_230,
        end: 24_606,
        part: "This is the first subtitle.",
        words: [
          { word: "this" },
          { word: "is" },
          { word: "the" },
          { word: "first" },
          { word: "subtitle" },
        ],
      },
      {
        start: 30_739,
        end: 34_074,
        part: "This is the second.",
        words: [
          { word: "this" },
          { word: "is" },
          { word: "the" },
          { word: "second" },
        ],
      },
      {
        start: 34_159,
        end: 35_743,
        part: "Third",
        words: [{ word: "third" }],
      },
    ]);
  });

  test("supports timestamp tags", async () => {
    const actual = await convertVttToJson(`
WEBVTT

00:00:00.000 --> 00:00:00.820 align:start position:0%
the<00:00:00.240><c> man</c><00:00:00.459><c> who</c><00:00:00.530><c> inspired</c><00:00:00.789><c> the</c>
`);

    expect(actual).toHaveLength(5);

    expect(actual).toEqual([
      {
        start: 0,
        end: 240,
        part: "the",
        words: [{ word: "the" }],
      },
      {
        start: 240,
        end: 459,
        part: "man",
        words: [{ word: "man" }],
      },
      {
        start: 459,
        end: 530,
        part: "who",
        words: [{ word: "who" }],
      },
      {
        start: 530,
        end: 789,
        part: "inspired",
        words: [{ word: "who" }],
      },
      {
        start: 789,
        end: 820,
        part: "the",
        words: [{ word: "the" }],
      },
    ]);
  });
});
