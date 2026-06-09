# Cloud Storage Migration Assessment (Cloud-Tool-demo)

[简体中文](README.md) | **English**

A pure front-end single-page app that quickly estimates **duration, effective throughput, migration architecture, and optimization advice** for cloud storage migrations during pre-sales research and solution assessment. Enter the customer environment and the page instantly generates assessment metrics, a Mermaid architecture diagram, a duration-breakdown bar chart, and targeted recommendations.

## Features

- **Real-time assessment**: any parameter change triggers recalculation (120ms debounce), no submit needed.
- **Multi-medium models**: built-in parameter models for block, file, and object storage (protocol, migration tool, metadata overhead, transfer efficiency, small-file penalty).
- **Duration estimation**: total time is split into "Setup → Data transfer → Metadata sync → Validation", plus an estimated total with a 20% buffer.
- **Cross-region factor**: automatically applies a latency factor for same-region, same-country, cross-border, and on-prem-to-cloud paths based on source/target locations.
- **Small-file penalty**: when the average file is under 1 MB, metadata sync time is scaled up and a small-file optimization tip is triggered.
- **Parallel acceleration**: parallel channel count affects metadata throughput as √N (capped at 4×).
- **Visual architecture diagram**: a "Source → Migration gateway → Network → Target" flowchart generated dynamically with Mermaid.
- **Smart advice**: migration notes and optimization directions based on storage type, file size, cross-border distance, and bandwidth share.
- **Bilingual (中文 / English)**: one-click toggle in the top-right corner, with the last choice remembered and the initial language detected from the browser.

## Quick Start

No build step and no dependency installation. Mermaid is loaded via CDN, so **an internet connection is required**.

Just open `index.html` in a browser. If your browser restricts loading scripts from local files, start a static server:

```powershell
# either one
python -m http.server 8080
# or
npx serve .
```

Then visit `http://localhost:8080`.

## Input Parameters

| Parameter | Description |
| --- | --- |
| Data Volume | Total data size, supports GB / TB / PB |
| File Count | Used to compute average file size and metadata overhead |
| Storage Type | Block / File / Object, determines the migration model |
| Source Location | Includes China regions, Hong Kong, Singapore, Tokyo, Frankfurt, Virginia, and on-prem IDC |
| Target Location | Same location list as above |
| Migration Bandwidth | Supports Mbps / Gbps |
| Parallel Channels | 1–32, affects metadata and object migration throughput |

## Output

- **Core metrics**: estimated total (with buffer), baseline duration, effective throughput (Mbps and TB/hour), total data volume.
- **Architecture diagram**: a Mermaid flowchart rendered dynamically based on storage type and locations.
- **Duration breakdown**: a bar chart of the four phases.
- **Architecture & migration advice**: recommended path, small-file optimization, cross-border transfer, per-medium notes, and bandwidth-bottleneck tips.

## Estimation Model

```
effective bandwidth = bandwidth × transfer efficiency × (1 / cross-region factor)
transfer time       = data volume (bit) / effective bandwidth
metadata time       = file count × per-file metadata time × small-file factor / parallel boost (√N, ≤4)
setup time          = block 2h / file 1h / object 0.5h
validation time     = transfer time × 8% + file count × 0.001s
total time          = setup + transfer + metadata + validation
estimated total     = total time × 1.2 (20% buffer)
```

> Estimates are based on typical cloud-migration models. Actual duration varies with network jitter, small-file ratio, API throttling, and other factors; budget a 15%–30% buffer.

## Project Structure

```
Cloud-Tool-demo/
├── index.html        # Page structure and form
├── css/
│   └── style.css     # Dark theme styles
└── js/
    └── app.js        # Input collection, estimation model, Mermaid rendering, advice, i18n
```

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no framework, no build tool)
- [Mermaid](https://mermaid.js.org/) 10 (loaded via CDN, for diagram rendering)
