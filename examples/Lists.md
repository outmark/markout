- [x] Square

  - Square
    - Square
    * Disc

- [x] Disc

  - Disc
    - Square
    * Disc

- [x] Latin Numbering

  a) Latin (auto)
  iv. Roman (coerced)

  11. Arabic (coerced)
      g. Latin (coerced)
      a. Latin (auto)

- [x] Arabic Numbering

  1. Arabic (auto)
     g. Latin (coerced)
     iv. Roman (coerced)

  11) Arabic (coerced)
  1) Arabic (auto)

- [x] Roman Numbering

  i. Roman (auto)

  11. Arabic (coerced)
      g. Latin (coerced)
      iv. Roman (coerced)
      i. Roman (auto)

---

> **Note**: Markdown handles this differently

---

- [x] Markout's Unordered Lists <figure columns:=20em>

  - [x] Square <figure class=ul font-size:=90%>

    - Square
      - Square
      * Disc

  - [x] Disc <figure class=ul font-size:=90%>

    - Disc
      - Square
      * Disc

- [x] Markout's Ordered Lists <figure columns:=20em>

  - [x] Latin Numbering <figure class=ol font-size:=90%>

    a) `a) Latin (auto)`
    iv. `iv. Roman (coerced)`

    11. `11. Arabic (coerced)`
        g. `g. Latin (coerced)`
        a. `h. Latin (auto)`

  - [x] Arabic Numbering <figure class=ol font-size:=90%>

    1. `1) Arabic (auto)`
       g. `g. Latin (coerced)`
       iv. `iv. Roman (coerced)`

    11) `11. Arabic (coerced)`
    1)  `1. Arabic (auto)`

  - [x] Roman Numbering <figure class=ol font-size:=90%>

    i. `i. Roman (auto)`

    11. `11. Arabic (coerced)`
        g. `g. Latin (coerced)`
        iv. `iv. Roman (coerced)`
        i. `i. Roman (auto)`

- [x] Markout's Checklists <figure columns:=20em>

  - [x] Force-Checked <figure class=ul font-size:=90%>

    - [x] `- [x] Checked`
      - [x] `- [x] Checked`
      - [-] `- [-] Indeterminate`
      - [ ] `- [ ] Unchecked`

  - [x] Force-Indeterminated <figure class=ul font-size:=90%>

    - [-] `- [-] Indeterminate`
      - [x] `- [x] Checked`
      - [-] `- [-] Indeterminate`
      - [ ] `- [ ] Unchecked`

  - [x] Auto-Unchecked <figure class=ul font-size:=90%>

    - [ ] `- [ ] Unchecked`
      - [x] `- [x] Checked`
      - [-] `- [-] Indeterminate`
      - [ ] `- [ ] Unchecked`
