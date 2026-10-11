# Catchmind polish

Catchmind uses the shared game-polish contract while keeping its existing synchronized canvas, tool controls, bilingual chat, translation, and server-owned settings/actions.

| Axis | Catchmind behavior |
| --- | --- |
| Visual | Paper canvas and compact tool shelf remain intact; the current phase is labeled beside the round, the active tool/color/width stay visible, and the current hint is presented as a small public cue. |
| UX | The round header identifies whether the player is drawing, guessing, choosing, or viewing a result. Timer and seat scores remain legible without replacing the canvas or existing controls. |
| Events | Score changes use `GameValue`; newly appended public guess rows, hints, phases, rounds, and results animate only on insertion or public-view change. Correct guesses keep their existing accent. The countdown value itself has no looping animation, and its one-second refresh does not repaint the canvas. |
| Sound | The shared `GameFeedback` layer owns confirmed action/turn/result cues and sound preferences. Catchmind drawing and per-second timer updates do not add sounds. |
| Local feature | Existing pen, fill, picker, palette, secondary color, eraser, width, undo/clear, and authorized room settings remain available to the drawer. No new action or setting is added. |
| Verification | Component tests cover bilingual role/phase labels, public score rendering, role-only drawing controls, masked hints, answer privacy, and timeout/finished copy. Reduced-motion rules disable the transition animations. |

The polish reads only the caller-specific public player view. The guesser never receives the active answer or word choices through this component; `board.answer` remains rendered only after the server has moved the round to a public result, and `hand.answer` remains drawer-only. The existing chat text and settings authority are unchanged.
