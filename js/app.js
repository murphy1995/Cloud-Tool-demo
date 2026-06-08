(function () {
  "use strict";

  const LOCATIONS = [
    { id: "cn-north-beijing", label: "中国 · 北京", region: "华北" },
    { id: "cn-east-shanghai", label: "中国 · 上海", region: "华东" },
    { id: "cn-south-guangzhou", label: "中国 · 广州", region: "华南" },
    { id: "cn-southwest-chengdu", label: "中国 · 成都", region: "西南" },
    { id: "cn-northwest-xian", label: "中国 · 西安", region: "西北" },
    { id: "hk", label: "中国 · 香港", region: "亚太" },
    { id: "ap-southeast-sg", label: "新加坡", region: "亚太" },
    { id: "ap-northeast-tokyo", label: "日本 · 东京", region: "亚太" },
    { id: "eu-west-frankfurt", label: "德国 · 法兰克福", region: "欧洲" },
    { id: "us-east-virginia", label: "美国 · 弗吉尼亚", region: "北美" },
    { id: "on-prem-idc", label: "本地 IDC / 私有云", region: "本地" },
  ];

  const STORAGE_PROFILES = {
    block: {
      label: "块存储",
      protocol: "iSCSI / FC / NVMe-oF",
      migrationTool: "块级复制 / 存储快照同步",
      metadataPerFileSec: 0.002,
      transferEfficiency: 0.82,
      smallFilePenalty: 1.0,
      hint: "适合数据库、虚拟机磁盘；迁移以 LUN/卷为单位，元数据开销较低。",
    },
    file: {
      label: "文件存储",
      protocol: "NFS / SMB / CIFS",
      migrationTool: "文件同步服务 / rsync / 专用迁移网关",
      metadataPerFileSec: 0.045,
      transferEfficiency: 0.72,
      smallFilePenalty: 1.8,
      hint: "适合共享目录、内容库；大量小文件会显著增加元数据同步时间。",
    },
    object: {
      label: "对象存储",
      protocol: "S3 / OSS / OBS API",
      migrationTool: "对象迁移服务 / 数据同步工具",
      metadataPerFileSec: 0.018,
      transferEfficiency: 0.78,
      smallFilePenalty: 1.4,
      hint: "适合备份、静态资源、数据湖；支持多路并行与断点续传。",
    },
  };

  const CROSS_REGION_LATENCY = {
    same: 1.0,
    sameCountry: 1.08,
    crossBorder: 1.25,
    onPremToCloud: 1.15,
  };

  let mermaidInitialized = false;
  let renderTimer = null;

  const els = {
    dataVolume: document.getElementById("dataVolume"),
    dataUnit: document.getElementById("dataUnit"),
    fileCount: document.getElementById("fileCount"),
    storageType: document.getElementById("storageType"),
    sourceLocation: document.getElementById("sourceLocation"),
    targetLocation: document.getElementById("targetLocation"),
    bandwidth: document.getElementById("bandwidth"),
    bandwidthUnit: document.getElementById("bandwidthUnit"),
    parallelism: document.getElementById("parallelism"),
    parallelismValue: document.getElementById("parallelismValue"),
    avgFileSizeHint: document.getElementById("avgFileSizeHint"),
    storageTypeHint: document.getElementById("storageTypeHint"),
    metrics: document.getElementById("metrics"),
    mermaidContainer: document.getElementById("mermaidContainer"),
    timeline: document.getElementById("timeline"),
    recommendations: document.getElementById("recommendations"),
  };

  function populateLocationSelects() {
    const options = LOCATIONS.map(
      (loc) => `<option value="${loc.id}">${loc.label}</option>`
    ).join("");
    els.sourceLocation.innerHTML = options;
    els.targetLocation.innerHTML = options;
    els.sourceLocation.value = "on-prem-idc";
    els.targetLocation.value = "cn-east-shanghai";
  }

  function toBytes(volume, unit) {
    const multipliers = { GB: 1e9, TB: 1e12, PB: 1e15 };
    return volume * (multipliers[unit] || 1e12);
  }

  function toMbps(value, unit) {
    return unit === "Gbps" ? value * 1000 : value;
  }

  function formatBytes(bytes) {
    if (bytes >= 1e15) return (bytes / 1e15).toFixed(2) + " PB";
    if (bytes >= 1e12) return (bytes / 1e12).toFixed(2) + " TB";
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + " GB";
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + " MB";
    return bytes + " B";
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "—";
    if (seconds < 60) return Math.ceil(seconds) + " 秒";
    if (seconds < 3600) return Math.ceil(seconds / 60) + " 分钟";
    if (seconds < 86400) {
      const h = Math.floor(seconds / 3600);
      const m = Math.ceil((seconds % 3600) / 60);
      return m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`;
    }
    const d = Math.floor(seconds / 86400);
    const h = Math.ceil((seconds % 86400) / 3600);
    return h > 0 ? `${d} 天 ${h} 小时` : `${d} 天`;
  }

  function getLocation(id) {
    return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
  }

  function getRegionFactor(sourceId, targetId) {
    const source = getLocation(sourceId);
    const target = getLocation(targetId);
    if (sourceId === targetId) return CROSS_REGION_LATENCY.same;
    if (source.region === "本地" || target.region === "本地") {
      return CROSS_REGION_LATENCY.onPremToCloud;
    }
    if (source.label.startsWith("中国") && target.label.startsWith("中国")) {
      return CROSS_REGION_LATENCY.sameCountry;
    }
    return CROSS_REGION_LATENCY.crossBorder;
  }

  function collectInputs() {
    const dataVolume = parseFloat(els.dataVolume.value) || 0;
    const fileCount = parseInt(els.fileCount.value, 10) || 1;
    const storageType = els.storageType.value;
    const sourceLocation = els.sourceLocation.value;
    const targetLocation = els.targetLocation.value;
    const bandwidthMbps = toMbps(
      parseFloat(els.bandwidth.value) || 1,
      els.bandwidthUnit.value
    );
    const parallelism = parseInt(els.parallelism.value, 10) || 1;

    return {
      dataVolume,
      dataUnit: els.dataUnit.value,
      fileCount,
      storageType,
      sourceLocation,
      targetLocation,
      bandwidthMbps,
      parallelism,
    };
  }

  function estimateMigration(input) {
    const profile = STORAGE_PROFILES[input.storageType];
    const dataBytes = toBytes(input.dataVolume, input.dataUnit);
    const avgFileSize = dataBytes / input.fileCount;
    const regionFactor = getRegionFactor(input.sourceLocation, input.targetLocation);

    const effectiveMbps =
      input.bandwidthMbps * profile.transferEfficiency * (1 / regionFactor);
    const transferSeconds = (dataBytes * 8) / (effectiveMbps * 1e6);

    const smallFileThreshold = 1024 * 1024;
    let metadataMultiplier = 1;
    if (avgFileSize < smallFileThreshold) {
      const ratio = smallFileThreshold / Math.max(avgFileSize, 1024);
      metadataMultiplier = 1 + (ratio - 1) * 0.15 * profile.smallFilePenalty;
    }

    const parallelBoost = Math.min(Math.sqrt(input.parallelism), 4);
    const metadataSeconds =
      (input.fileCount * profile.metadataPerFileSec * metadataMultiplier) /
      parallelBoost;

    const setupSeconds =
      input.storageType === "block"
        ? 3600 * 2
        : input.storageType === "file"
          ? 3600
          : 1800;

    const validationSeconds = transferSeconds * 0.08 + input.fileCount * 0.001;

    const totalSeconds =
      setupSeconds + transferSeconds + metadataSeconds + validationSeconds;

    const bufferedSeconds = totalSeconds * 1.2;

    return {
      profile,
      dataBytes,
      avgFileSize,
      regionFactor,
      effectiveMbps,
      setupSeconds,
      transferSeconds,
      metadataSeconds,
      validationSeconds,
      totalSeconds,
      bufferedSeconds,
      source: getLocation(input.sourceLocation),
      target: getLocation(input.targetLocation),
    };
  }

  function typeTargetNode(input, result) {
    const targetLabel = result.target.label.replace(/"/g, "'");
    const type = input.storageType;
    if (type === "block") {
      return `TGT["💾 目标块存储<br/>${targetLabel}<br/>云硬盘 / SAN"]`;
    }
    if (type === "file") {
      return `TGT["📂 目标文件存储<br/>${targetLabel}<br/>NAS / 文件服务"]`;
    }
    return `TGT["🪣 目标对象存储<br/>${targetLabel}<br/>Bucket"]`;
  }

  function buildMermaidDiagramFixed(input, result) {
    const type = input.storageType;
    const sourceLabel = result.source.label.replace(/"/g, "'");
    const targetLabel = result.target.label.replace(/"/g, "'");
    const tool = result.profile.migrationTool;

    const sourceNode =
      type === "block"
        ? `SRC["🗄 源块存储<br/>${sourceLabel}<br/>LUN / 卷"]`
        : type === "file"
          ? `SRC["📁 源文件存储<br/>${sourceLabel}<br/>NFS / SMB"]`
          : `SRC["🪣 源对象存储<br/>${sourceLabel}<br/>Bucket"]`;

    const gatewayNode =
      type === "block"
        ? `GW["⚙ 迁移主机 / 存储网关<br/>块级复制 · 快照同步<br/>${input.parallelism} 路 I/O"]`
        : type === "file"
          ? `GW["⚙ 文件迁移网关<br/>${tool}<br/>${input.parallelism} 路并行"]`
          : `GW["⚙ 对象迁移服务<br/>${tool}<br/>${input.parallelism} 路并发"]`;

    const targetNode = typeTargetNode(input, result);
    const networkLabel = `${Math.round(input.bandwidthMbps)} Mbps`;

    return `flowchart LR
    ${sourceNode}
    ${gatewayNode}
    ${targetNode}
    NET(("🌐 迁移网络<br/>${networkLabel}"))

    SRC -->|"读取数据"| GW
    GW --> NET
    NET -->|"写入目标"| TGT

    classDef source fill:#1e3a5f,stroke:#3b82f6,color:#e8edf4
    classDef gateway fill:#2d3748,stroke:#f59e0b,color:#e8edf4
    classDef target fill:#1a3d2e,stroke:#22c55e,color:#e8edf4
    classDef network fill:#3b2f4a,stroke:#a78bfa,color:#e8edf4

    class SRC source
    class GW gateway
    class TGT target
    class NET network`;
  }

  async function renderMermaid(code) {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        flowchart: { curve: "basis", padding: 16 },
        themeVariables: {
          darkMode: true,
          background: "#243044",
          primaryColor: "#1e3a5f",
          primaryTextColor: "#e8edf4",
          lineColor: "#8b9cb3",
        },
      });
      mermaidInitialized = true;
    }

    els.mermaidContainer.innerHTML = "";
    const id = "mermaid-" + Date.now();
    const { svg } = await mermaid.render(id, code);
    els.mermaidContainer.innerHTML = svg;
  }

  function renderMetrics(input, result) {
    const throughputTBh =
      (result.effectiveMbps * 1e6) / 8 / 1e12 * 3600;

    els.metrics.innerHTML = `
      <div class="metric-card metric-card--primary">
        <div class="metric-card__label">预估总时长（含缓冲）</div>
        <div class="metric-card__value">${formatDuration(result.bufferedSeconds)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__label">基准时长（不含缓冲）</div>
        <div class="metric-card__value">${formatDuration(result.totalSeconds)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__label">有效吞吐</div>
        <div class="metric-card__value">${result.effectiveMbps.toFixed(0)} Mbps</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__label">约 ${throughputTBh.toFixed(2)} TB/小时</div>
        <div class="metric-card__value">${formatBytes(result.dataBytes)}</div>
      </div>
    `;
  }

  function renderTimeline(result) {
    const phases = [
      { key: "setup", label: "环境准备与连通", seconds: result.setupSeconds, cls: "setup" },
      { key: "transfer", label: "数据传输", seconds: result.transferSeconds, cls: "transfer" },
      { key: "metadata", label: "元数据 / 目录同步", seconds: result.metadataSeconds, cls: "metadata" },
      { key: "validation", label: "校验与收尾", seconds: result.validationSeconds, cls: "validation" },
    ];

    const maxSec = Math.max(...phases.map((p) => p.seconds), 1);

    els.timeline.innerHTML = phases
      .map(
        (p) => `
      <div class="timeline-item">
        <span class="timeline-item__label">${p.label}</span>
        <div class="timeline-item__bar-wrap">
          <div class="timeline-item__bar timeline-item__bar--${p.cls}" style="width:${Math.max((p.seconds / maxSec) * 100, 4)}%"></div>
        </div>
        <span class="timeline-item__duration">${formatDuration(p.seconds)}</span>
      </div>`
      )
      .join("");
  }

  function renderRecommendations(input, result) {
    const recs = [];
    const avgMB = result.avgFileSize / (1024 * 1024);

    recs.push({
      title: "推荐迁移架构",
      text: `采用「${result.source.label} → ${result.profile.migrationTool} → ${result.target.label}」链路。${result.profile.protocol} 协议层数据经 ${input.parallelism} 路并行通道传输至目标 ${result.profile.label}。`,
    });

    if (avgMB < 1 && input.storageType !== "block") {
      recs.push({
        title: "小文件优化",
        text: `平均文件约 ${avgMB < 0.01 ? "< 0.01" : avgMB.toFixed(2)} MB，建议打包迁移、提高并行度，或使用专用小文件加速方案，可缩短元数据阶段 30%–50%。`,
      });
    }

    if (result.regionFactor >= CROSS_REGION_LATENCY.crossBorder) {
      recs.push({
        title: "跨境 / 远距离传输",
        text: "源与目标跨地域较远，建议启用压缩传输、就近中转节点，或分阶段迁移（先热数据后冷数据）以降低窗口期风险。",
      });
    }

    if (input.storageType === "block") {
      recs.push({
        title: "块存储注意事项",
        text: "迁移前创建一致性快照；业务侧需规划 RPO/RTO，必要时采用双写或增量同步缩短割接窗口。",
      });
    } else if (input.storageType === "object") {
      recs.push({
        title: "对象存储注意事项",
        text: "关注 ACL、版本号、生命周期策略映射；大对象使用分片上传，并配置断点续传与失败重试队列。",
      });
    } else {
      recs.push({
        title: "文件存储注意事项",
        text: "保留 UID/GID、ACL 与硬链接；评估 NFS 版本兼容性，建议在业务低峰期执行全量 + 增量同步。",
      });
    }

    const bwRatio = result.transferSeconds / result.totalSeconds;
    if (bwRatio > 0.7) {
      recs.push({
        title: "带宽瓶颈",
        text: "数据传输占主导，可考虑专线升带宽、多链路聚合，或先在目标区域部署缓存节点再内网同步。",
      });
    }

    els.recommendations.innerHTML = recs
      .map(
        (r) => `
      <div class="rec-card">
        <strong>${r.title}</strong>
        <p>${r.text}</p>
      </div>`
      )
      .join("");
  }

  function updateHints(input, result) {
    els.avgFileSizeHint.textContent =
      "平均文件大小：" + formatBytes(result.avgFileSize);
    els.storageTypeHint.textContent = result.profile.hint;
    els.parallelismValue.textContent = String(input.parallelism);
  }

  function render() {
    const input = collectInputs();
    if (input.dataVolume <= 0 || input.fileCount <= 0 || input.bandwidthMbps <= 0) {
      return;
    }

    const result = estimateMigration(input);
    updateHints(input, result);
    renderMetrics(input, result);
    renderTimeline(result);
    renderRecommendations(input, result);

    const diagram = buildMermaidDiagramFixed(input, result);
    renderMermaid(diagram).catch(function (err) {
      console.error("Mermaid render error:", err);
      els.mermaidContainer.innerHTML =
        '<p style="color:#f59e0b;padding:20px;">架构图渲染失败，请刷新页面重试。</p>';
    });
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 120);
  }

  function bindEvents() {
    const form = document.getElementById("evalForm");
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(function (el) {
      el.addEventListener("input", scheduleRender);
      el.addEventListener("change", scheduleRender);
    });
    els.parallelism.addEventListener("input", function () {
      els.parallelismValue.textContent = els.parallelism.value;
    });
  }

  populateLocationSelects();
  bindEvents();
  render();
})();
