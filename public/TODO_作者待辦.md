# 作者待辦總表（一頁入口）

> 最後人工更新：2026-11-12（台北）。本檔為**手動維護**的單一入口；`handoff/LATEST.md` 為自動快照，僅供參考。
> 細節與 DOI 請看各連結檔，本檔不重複。

## A. 需要你動手：協助尋找的 PDF
**缺漏 17 筆**（2026-11-12 由 Google Drive 共享資料夾新取得 5 筆：sarstedt2019specify、mcknight2002developing、hart2015bidr16、podsakoff2003common、schepman2020gaais）。
DOI 與來源明細：`handoff/overnight_2026-11-12/MISSING_PDF_SEARCH_FOR_OTHER_MODELS.md`

| 類型 | bib key |
|---|---|
| 期刊論文（需學校圖書館下載） | cheng2026sycophantic、sari2026religious、kruger1999unskilled（僅有 2009 重印版，需 1999 原刊）、brislin1970back、shmueli2019predictive、krumrei2016cihs（僅有量表原文，需期刊版）、exline2023rss14（Drive 內檔案誤植，已拒收）、koenig2010durel、lawshe1975cvr、polit2006cvi、willis2005cognitive（Drive 內為簡報，已拒收）、anthropic2026personalguidance |
| 書籍／章節／測驗手冊 | chin1998partial、hayes2022introduction、cohen1988statistical、paulhus1991measurement、paulhus1998paulhus |
| 待作者裁定（新候選，未加入 bib） | ibrahim2026（arXiv 2605.07912，存於 `_not_matched/`） |

- 取得方式：學校圖書館（Scopus、Airiti、Wiley、APA PsycNET 等）下載後，依 bib key 命名放入 `references/pdfs/`。我會做 `%PDF` 與題名核對。
- 我可以自行取得的 OA 版本已用盡（見 `academic-paper-retrieval` 技能）。

## B. 需要你裁定／確認
| # | 事項 | 狀態 | 你要做什麼 |
|---|---|---|---|
| 1 | 第 1 點橋接：序列解釋式 vs 互補三角驗證 | 待裁定（作者：同場施測，A 需改寫為 A'，見 `handoff/roundtable/BRIDGE_A_PRIME_2026-11-12.md`） | 請回覆 A'（同場依序施測＋理論預先登記）或 B |
| 2 | 宗教虔誠度作為調節變數 | ✅ 作者同意（探索性） |
| 3 | 單模型→雙模型的「歷程」理由 | ✅ 作者同意：無歷程依據，只寥寫現在式理由 | repo 內查無單模型版本；若有記憶或檔案請提供，否則論文只寫現在式理由 |
| 4 | Holm 的 JSTOR URL | ✅ 已核實（2026-11-12） | JSTOR 頁面確認：標題 *A Simple Sequentially Rejective Multiple Test Procedure*，Sture Holm，*Scandinavian Journal of Statistics* 6(2), 65–70（1979）。bib 與參考文獻已一致，無需再改 |
| 5 | Rathje「OSF v4」版本 | ✅ 已核實（2026-11-12） | 公開頁 osf.io/preprints/psyarxiv/vmyek：標題、7 位作者與 bib 一致；頁面提供的引用格式為 `vmyek_v4`（PsyArXiv，2026-08-06）。注意：頁面內檔案元資料寫 Version: 1，引用以 v4 為準；若要更嚴謹，請在 PDF 首頁或 OSF 版本列表再確認一次 |
| 6 | 倫理聲明使用時點 | 已定 | 「本研究程序已依審查委員會同意之內容執行。」只在 IRB 核准書取得後寫入正文 |
| 7 | 模型一、模型二的樣本數（N=350／N=160） | ✅ 作者同意：模擬完成後再定案 | 模擬完成後由 Hermes 提出建議，再由你定案 |

## C. 由 Hermes 執行中（不需你動作）
- A7 完整模擬：N=350 與 N=500，R=400、NBOOT=1000。預計約 10 小時以上，完成會通知；結果寫入 `analysis/plssem_power/power_v3_*.csv`。
- A8 命名對照表：草稿在 `handoff/roundtable/REVIEW_SENIOR_PHD_2026-11-12.md` 第 5 節，待你確認後全檔統一。
- ✅ A10：附錄 B 已依 GPT-6 必修與其他修正改寫（2026-11-12，`dist_draft/src/論文計畫書_草稿.md`）。
- ✅ thesis/02 重複「完整討論待補附錄」已修；Teng 2026 與草稿統一為「說服性風險（相鄰概念）」。
- ✅ 「宗教判斷確信感」定義已列入附錄 B（主觀把握，非客觀正確性）；方法章正文的同義段落待下一輪統一。
- 「預期討論與研究限制」草稿：`handoff/drafts/DISCUSSION_EXPECTED_AND_LIMITATIONS_DRAFT.md`（只含預期，無結果）。

## D. 已完成（僅供查核）
- Cheng 統一為 Science 2026；Hart 第一作者 Claire M. Hart；Exline 依 DOI 頁面；Holm 改 JSTOR URL（已核實）。
- 學姐四點：已依裁定套用（雙模型保留＋橋接句、命名定義、CHALLENGE、題目改為現行版本）。
- 多模型審查彙整：`handoff/roundtable/MULTI_MODEL_SENIOR_2026-11-12/SYNTHESIS.md`。
- 模型分工與成本：`handoff/roundtable/README.md`。

## E. 判斷規則（提醒自己）
- 未取得 IRB 核准前：不招募、不寫「已核准」。
- 引用無法核實者：標示「無法核實」，不採用。
- Claude 不寫成「不諂媚」。
