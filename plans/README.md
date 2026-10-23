# Animation implementation plans — 921bac6

The user already selected all concrete corrective findings for fixes; no new permission gate. The motion advisor wrote plans only and changed no product code. Read output/current-review/full-skill-review/motion/review.md for evidence; every plan is self-contained.

| Plan | Severity | Status | Owner / dependency |
| --- | --- | --- | --- |
|001 Hero face occlusion|HIGH|IMPLEMENTED; see integrated review|same visual owner; independent|
|002 Live reduced preference|MEDIUM|IMPLEMENTED; see integrated review|bounded component owner; independent|
|003 Room hint input gates|MEDIUM|IMPLEMENTED; see integrated review|CSS owner; independent|
|004 Paper transform layout|MEDIUM|IMPLEMENTED; see integrated review|shared host owner|
|005 Embedded frame state|MEDIUM|IMPLEMENTED; see integrated review|shared host owner; after004 to avoid same-file conflict|
|006 Gallery idle work|MEDIUM|IMPLEMENTED; see integrated review|gallery owner; independent|
|007 Duel expression cut|MEDIUM|IMPLEMENTED; see integrated review|duel CSS owner; independent|

Recommended order:001/002/003/006/007 may proceed in separate owned files;004 then005 sequentially. Review all integrated changes with review-animations and run bounded desktop interaction checks within the desktop-only review scope (mobile and video excluded by the user). Optional O1/O2 additive opportunities are not corrective plan dependencies and have no automatic implementation requirement.
