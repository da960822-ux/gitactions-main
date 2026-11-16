# Public 2013 mobile calculator: read-only formula extraction

Source: https://cafe.naver.com/ca-fe/cafes/26203446/articles/124693 , author 나비랑, posted2013-12-01, attachment 모두의 마블 계산기 ver4.xls. Parent obtained by normal public UI without login. Local source original-calculator-ver4.xls SHA256 `4fef32669739e3434b96aa0577e6fb32761d70d8958d4db3b95bbe4ca3cda5ef`.

This is a community-created calculator, not original game source or official specification. Exact extraction of its formulas establishes what this calculator asserts. Matching 2015 screenshots strengthens selected rows, not every rule or later version.

Read using installed xlrd2.0.1, BIFF FORMULA token decompiler; no macros, workbook recalculation, external links or executable spreadsheet content executed. Original file unchanged. Nine visible sheets; no hidden data-sheet table. Price constants embedded directly in formulas. Full values and formula text: xls_cells_formulas.json. Engine data:2013_exact_formula_engine_data.json. Korea table:2013_korea_economy_exact.csv.

## Exact formula behavior
- Class multipliers: economy1, business2.5, first5. Workbook cells 건설비용 계산!D10 and 통행료 계산!D14.
- Raw currency unit = marble, not 만. Do not multiply existing first values by5 again.
- Construction component = INT(base × class × (1 − constructionStat×0.005)). Each component individually floored, then totals added.
- Takeover component = INT(2 × base × class × (1 − takeoverStat×0.005)); stage totals sum separately floored components.
- Ordinary city toll = INT(baseStage × class × (1+tollBonusPercent/100) × color × festival × hosting × ripoff × (1−tollStat×0.003)). One final floor.
- Tourism toll uses same formula EXCEPT omits color factor completely. Korea/world cost100000; base stages80000/160000/320000. Space pink tourism cost60000; stages60000/120000/240000. Space blue remains same as Korea/world.
- Sale = INT(A×class×(1−constructionStat×0.005)×specialStat×0.007+B×class/2). Normal A=B=nominal investment. Landmark A includes extra landmark construction; B excludes that extra, retaining land+all3normal. At zero stats landmark has same salvage as all3building stage.
- All three maps share city rows except spaceUranus: land66000 (Tokyo/Incheon72000), toll[12000,40000,120000,320000,920000] (Tokyo/Incheon[14000,46000,130000,350000,950000]). These are explicit IF branches, not inferred.

## Known and unknown building masks
Cost sheet supplies each independent construction component, so all cost subsets can be computed. Sale sheet expressly contains masks0,1,5,6,3,7,landmark. Toll sheet ONLY contains land0, villa1, villa+building3, all3buildings7, landmark. It does not supply masks2,4,5,6. Taking differences of sequential tolls to derive standalone building tolls is a DESIGN INFERENCE, not formula-grounded evidence. Preserve unknown masks or label that inference.

## Validation
306 independent arithmetic comparisons against cached workbook outputs passed:18cities×(5construction+5toll+7sale). No mismatch. See xls_extraction_validation.json. Calculation uses Decimal, not executable workbook evaluation. Source class selections:constructionfirst, sale/takeoverbusiness, tollfirst with44.4 boost.

Crosschecks with parent-verified2015 screenshots: Cairo economy land54000, villa20000, building60000, hotel100000 exact. KoreaBusan economy land192000,villa80000,building240000,hotel400000,landmarkextra400000 exact; all3base toll1220000 ×2=2440000 screenshot exact. Earlier image-only candidate CSV misread NewYork hotel as630만 first: actual workbook is610만. Supersede image-only candidate with exact_formula_engine_data.json.

## Remaining open requirements
Starting salary, loan, tax, insolvency settlement, team rules, match duration and ownership inheritance do not appear as calculator sheets/formulas. These cannot be derived from this file. Unknown nonsequential tolls, rounding game equivalence, acquisition proceeds to old owner, and stat caps require gameplay or official evidence. Formula-floor consistency verifies extraction, not game engine fidelity. No clipping to prevent negative charges is present in extracted historical formulas; modern stat values must not be extrapolated blindly.

## Independent-mask screenshot crosscheck
Pixel-inspected 2015 Cairo screenshot https://upload2.inven.co.kr/upload/2015/03/27/bbs/i12866364001.png?MW=800 (local marble-research/mobile_buy.png): land mandatory54000, villa20000 unchecked, building60000 checked, hotel100000 locked; cost114000, build discount43890, pay70110; displayed toll56000. Additive prediction mask2 =76000−28000+8000=56000 matches. This directly observes Cairo mask2 and supports, but does not prove, universal additive contributions. Other masks/cities remain labeled additive inference. Separate engine candidate table `2013_additive_toll_candidates.json` includes all8 masks and spaceUranus override, keeping the exact extraction unchanged. No toll modifier field is visible in that screenshot.
