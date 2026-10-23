# Lisbeth domino rules (v2)

New games use these rules. Existing saved v0/v1 games retain their rules. The existing four-seat modes still use two human seats and two bots, with partners opposite each other.

- Match target: 200 by default, selectable 100 or 200.
- Deal seven tiles per seat. In 1v1 the unused 14 tiles stay out of play; the first deal guarantees that 6|6 is in a dealt hand. The first hand must open with 6|6. Later hands are opened by the actual previous winning player with any tile.
- On the first response to a double opening, a pass earns the opener's side 30. On later hands a non-double opening earns 60 instead. In four-seat play, award it only after the third seat actually plays; if that seat also passes, cancel it. In 1v1 no third-seat condition applies. These opening bonuses settle with the hand, once per opening, and are separate from paso corrido (not enabled).
- Capicúa: the final non-double must fit both prior ends, and those ends must differ. Award 30 plus all remaining hand pips, including the winner's partner.
- Tranque: when all seven distinct tiles for each exposed number have been played, stop immediately. Otherwise an entire cycle of legal passes ends a blocked hand. Compare only the trancador (last player to place a tile) with the next seat. Fewer remaining pips wins; ties go to the trancador. The winner's side receives every pip left in all active hands, including the winning individual. Stock is never counted.

## Sources and interpretations

Lisbeth's supplied six rules are the primary specification. The user confirmed that rules 1–5 also apply to 1v1 and rule 6 does not.

[RDomino's Dominican rules](https://rdomino.com/reglas) closely match her first-hand opening, previous winner opening, individual tranque comparison, tie and capicúa. Its generic salida condition requires the opener's partner to play and allows a higher house award for a non-double. Applying the same cancellation condition to both 30 and 60 is the implementation's interpretation of that condition.

[Capi's Dominican rules](https://playcapi.com/rules) explicitly award all remaining hand pips after a tranque and confirm that a salida award is canceled when the partner cannot play. Its different draw, capicúa value, tie and other bonus rules were not adopted. RDomino's extra paso corrido, bonus cap and lisa rules were not added either.
