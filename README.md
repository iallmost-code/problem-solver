# The Problem Solver

A week in the life of an HVAC install supervisor. Drag-race the work truck to the job, fix seven kinds of broken systems before 4:00 PM, survive the random bullshit in between, then fish, race, game, or wrench on the project car until it's time to clock in again.

**Play:** https://iallmost-code.github.io/problem-solver/

Single HTML file, no build step.

Progress autosaves every half second and when you pause or leave the page. Continue restores your current job or activity, clock, cash, upgrades, and dialog choices. Earlier saves still load at the start of their saved day. Saves stay in the same browser and device; clearing browser data removes them.

Press **Escape** or tap **Ⅱ** to pause. The menu includes Resume, sound on/off, volume, and Save & Quit to Title. Switching apps or tabs pauses automatically. After resuming a hold-based micro-game, hold again when prompted to continue. **M** toggles sound during play.

Run regression checks with Node.js (no dependencies):

```sh
node --test test-save.cjs
```
