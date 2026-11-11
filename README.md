# The Problem Solver

A week in the life of an HVAC install supervisor. Drag-race the work truck to the job, fix seven kinds of broken systems before 4:00 PM, survive the random bullshit in between, then fish, race, game, or wrench on the project car until it's time to clock in again.

**Play:** https://iallmost-code.github.io/problem-solver/

Single HTML file, no build step. All game art and the cover typeface are embedded.

**The 3:59 Edition** adds [The Callback Files](https://iallmost-code.github.io/problem-solver/#files). Work 18 tickets across six puzzle types: pack the van, crack the parts locker, plot a fuel-limited route, fix the dispatch sign, reconstruct a dodgy run sheet, and push cases into their bays. Play at your own pace, take a hint or reset the board. Your best ticket scores stay on this browser.

**The 3:59 Shift** is a daily three-call gauntlet worth 300 points. Its end-of-shift receipt lets you copy your score and a link that gives another player exactly the same three calls, even on a different day. A miss costs 10 points and the first hint costs 15. Neither practice nor the daily shift touches your campaign save. In the workweek, optional Tuesday and Friday callbacks pay cash and reputation.

The edition also includes original garage and chapter artwork, 6 more break-room skits (14 total), and 12 new branching events. Start with **Clock in** for the campaign, **Callback Files** for the puzzles, or **Daily Gauntlet** for the three-call challenge.

The **Clocked-In & Fed-Up Edition** adds an illustrated sunrise depot, redesigned menus, comic character portraits, eight break-room skits, and more than 130 additional boss comments, excuses, reviews, partner messages, and random events. All character identities and locations are fictional, including text restored from older saves.

Six new quick games join the workday and Garage Night rotation:

- **Controller Exorcism:** correct stick drift with trim controls.
- **GPU Cable Shitshow:** match keyed PSU leads to the right sockets.
- **Quit Blaming the Stat:** diagnose the fault from service evidence.
- **Baitcaster Birds Nest:** untangle loops in dependency order.
- **Duct Pressure Politics:** route the exact flow through a valve manifold.
- **Tool Truck Accounting:** find the lowest total price, including fees.

**After-Hours Arcade** lets you choose any micro-game without changing campaign cash, reputation, or the saved workweek. **Break Room Theater** lets you watch every skit. New puzzles pause on very short screens and ask you to rotate or resize before continuing.

Progress autosaves every half second and when you pause or leave the page. Continue restores your current job or activity, clock, cash, upgrades, and dialog choices. Earlier saves still load at the start of their saved day. Saves stay in the same browser and device; clearing browser data removes them.

Press **Escape** or tap **Ⅱ** to pause. The menu includes Resume, sound on/off, volume, and Save & Quit to Title. Switching apps or tabs pauses automatically. After resuming a hold-based micro-game, hold again when prompted to continue. **M** toggles sound during play.

Run regression checks with Node.js (no dependencies):

```sh
node --test test-expansion.cjs test-callback.cjs
```
