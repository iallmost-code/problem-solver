# The Problem Solver — On Break

[Play the arcade](https://iallmost-code.github.io/problem-solver/).

Eight immediate-play HVAC minigames: Truck It, Pipe Dreams, Crossed Wires, Sniff Test, Hot Enough?, Airflow Politics, Board Meeting, and Shut the Damn Doors. Choose a game, pick a random problem, or play a shuffled five-game set. Short comments and result jokes replace dialogue/story screens. No fishing.

Gameplay art is rendered and animated in Canvas: truck suspension, spinning wheels, parallax roads, flowing pipe circuits, flexing leads, detector pulses, torch flame/sparks/molten seam, rotating fans, airflow particles, and flashing board pads. Native buttons overlay the scene for keyboard and touch input. Play uses no network dependencies. Local best scores and sound settings use a new storage key; the previous edition is archived on `archive/before-arcade-rebuild-20261112`.

Controls appear above each scene. Space launches/shifts the truck or holds the torch when the page has focus. Keys 1–4 repeat the board pads. Escape pauses. Switching tabs pauses the active game. The pause and result panels support keyboard navigation. Browser storage saves best scores and sound preferences, not unfinished rounds.

Open `index.html` directly with the accompanying files or serve this directory with `python -m http.server`. No build or install step is needed to play.

Rule checks: `node --test tests/rules.cjs`.
Browser acceptance: install Python Playwright, serve this directory on port 8790, then `python tests/browser.py`. It exercises all eight games on desktop and phone viewports, verifies actual animation frames and pause/replay, and captures screenshots.

The included display typeface is Barlow Condensed, under SIL OFL. See `assets/FONT-LICENSE.txt`.
