(function () {
  "use strict";

  /* ----------------------------- i18n 字典 ----------------------------- */

  const STORAGE_KEY = "cloud-tool-lang";
  let currentLang = "zh";

  const I18N = {
    zh: {
      htmlLang: "zh-CN",
      toggle: "EN",
      title: "云存储迁移调研与评估",
      subtitle: "输入客户环境参数，实时生成迁移架构与时长估算",
      inputPanel: "客户环境输入",
      resultPanel: "评估结果",
      labelDataVolume: "数据量",
      labelFileCount: "文件数量",
      labelStorageType: "存储介质",
      labelSourceLocation: "源存储位置",
      labelTargetLocation: "迁移目标",
      labelBandwidth: "迁移网络带宽",
      labelParallelism: "并行传输通道数",
      optBlock: "块存储 (Block Storage)",
      optFile: "文件存储 (File Storage)",
      optObject: "对象存储 (Object Storage)",
      diagramTitle: "迁移架构图",
      timelineTitle: "迁移时长分解",
      recsTitle: "架构与迁移建议",
      footer:
        "估算基于典型云迁移场景模型，实际时长受网络抖动、小文件比例、API 限流等因素影响，建议预留 15%–30% 缓冲。",
      avgFileSizePrefix: "平均文件大小：",
      avgFileSizeEmpty: "平均文件大小：—",
      parallelHint: (n) => `${n} 路并行（影响元数据与对象迁移吞吐）`,
      metricBuffered: "预估总时长（含缓冲）",
      metricBase: "基准时长（不含缓冲）",
      metricThroughput: "有效吞吐",
      metricPerHour: (tbh) => `约 ${tbh} TB/小时`,
      phaseSetup: "环境准备与连通",
      phaseTransfer: "数据传输",
      phaseMetadata: "元数据 / 目录同步",
      phaseValidation: "校验与收尾",
      diagramFailed: "架构图渲染失败，请刷新页面重试。",
      duration: {
        sec: (n) => `${n} 秒`,
        min: (n) => `${n} 分钟`,
        hour: (h, m) => (m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`),
        day: (d, h) => (h > 0 ? `${d} 天 ${h} 小时` : `${d} 天`),
        empty: "—",
      },
      diagram: {
        srcBlock: (loc) => `🗄 源块存储<br/>${loc}<br/>LUN / 卷`,
        srcFile: (loc) => `📁 源文件存储<br/>${loc}<br/>NFS / SMB`,
        srcObject: (loc) => `🪣 源对象存储<br/>${loc}<br/>Bucket`,
        gwBlock: (n) => `⚙ 迁移主机 / 存储网关<br/>块级复制 · 快照同步<br/>${n} 路 I/O`,
        gwFile: (tool, n) => `⚙ 文件迁移网关<br/>${tool}<br/>${n} 路并行`,
        gwObject: (tool, n) => `⚙ 对象迁移服务<br/>${tool}<br/>${n} 路并发`,
        tgtBlock: (loc) => `💾 目标块存储<br/>${loc}<br/>云硬盘 / SAN`,
        tgtFile: (loc) => `📂 目标文件存储<br/>${loc}<br/>NAS / 文件服务`,
        tgtObject: (loc) => `🪣 目标对象存储<br/>${loc}<br/>Bucket`,
        net: (mbps) => `🌐 迁移网络<br/>${mbps} Mbps`,
        edgeRead: "读取数据",
        edgeWrite: "写入目标",
      },
      recs: {
        archTitle: "推荐迁移架构",
        archText: (p) =>
          `采用「${p.source} → ${p.tool} → ${p.target}」链路。${p.protocol} 协议层数据经 ${p.parallelism} 路并行通道传输至目标 ${p.profileLabel}。`,
        smallFileTitle: "小文件优化",
        smallFileText: (mb) =>
          `平均文件约 ${mb} MB，建议打包迁移、提高并行度，或使用专用小文件加速方案，可缩短元数据阶段 30%–50%。`,
        crossBorderTitle: "跨境 / 远距离传输",
        crossBorderText:
          "源与目标跨地域较远，建议启用压缩传输、就近中转节点，或分阶段迁移（先热数据后冷数据）以降低窗口期风险。",
        blockTitle: "块存储注意事项",
        blockText:
          "迁移前创建一致性快照；业务侧需规划 RPO/RTO，必要时采用双写或增量同步缩短割接窗口。",
        objectTitle: "对象存储注意事项",
        objectText:
          "关注 ACL、版本号、生命周期策略映射；大对象使用分片上传，并配置断点续传与失败重试队列。",
        fileTitle: "文件存储注意事项",
        fileText:
          "保留 UID/GID、ACL 与硬链接；评估 NFS 版本兼容性，建议在业务低峰期执行全量 + 增量同步。",
        bandwidthTitle: "带宽瓶颈",
        bandwidthText:
          "数据传输占主导，可考虑专线升带宽、多链路聚合，或先在目标区域部署缓存节点再内网同步。",
      },
    },
    en: {
      htmlLang: "en",
      toggle: "中文",
      title: "Cloud Storage Migration Assessment",
      subtitle:
        "Enter the customer environment to generate migration architecture and duration estimates in real time",
      inputPanel: "Customer Environment",
      resultPanel: "Assessment Results",
      labelDataVolume: "Data Volume",
      labelFileCount: "File Count",
      labelStorageType: "Storage Type",
      labelSourceLocation: "Source Location",
      labelTargetLocation: "Target Location",
      labelBandwidth: "Migration Bandwidth",
      labelParallelism: "Parallel Channels",
      optBlock: "Block Storage",
      optFile: "File Storage",
      optObject: "Object Storage",
      diagramTitle: "Migration Architecture",
      timelineTitle: "Duration Breakdown",
      recsTitle: "Architecture & Migration Advice",
      footer:
        "Estimates are based on typical cloud-migration models. Actual duration varies with network jitter, small-file ratio, API throttling and other factors; budget a 15%–30% buffer.",
      avgFileSizePrefix: "Avg. file size: ",
      avgFileSizeEmpty: "Avg. file size: —",
      parallelHint: (n) =>
        `${n} parallel channels (affects metadata & object throughput)`,
      metricBuffered: "Estimated total (with buffer)",
      metricBase: "Baseline (no buffer)",
      metricThroughput: "Effective throughput",
      metricPerHour: (tbh) => `≈ ${tbh} TB/hour`,
      phaseSetup: "Setup & connectivity",
      phaseTransfer: "Data transfer",
      phaseMetadata: "Metadata / directory sync",
      phaseValidation: "Validation & cutover",
      diagramFailed: "Failed to render the diagram. Please refresh and retry.",
      duration: {
        sec: (n) => `${n} sec`,
        min: (n) => `${n} min`,
        hour: (h, m) => (m > 0 ? `${h} hr ${m} min` : `${h} hr`),
        day: (d, h) => (h > 0 ? `${d} d ${h} hr` : `${d} d`),
        empty: "—",
      },
      diagram: {
        srcBlock: (loc) => `🗄 Source Block<br/>${loc}<br/>LUN / Volume`,
        srcFile: (loc) => `📁 Source File<br/>${loc}<br/>NFS / SMB`,
        srcObject: (loc) => `🪣 Source Object<br/>${loc}<br/>Bucket`,
        gwBlock: (n) => `⚙ Migration Host / Gateway<br/>Block copy · snapshot sync<br/>${n}× I/O`,
        gwFile: (tool, n) => `⚙ File Migration Gateway<br/>${tool}<br/>${n}× parallel`,
        gwObject: (tool, n) => `⚙ Object Migration Service<br/>${tool}<br/>${n}× concurrent`,
        tgtBlock: (loc) => `💾 Target Block<br/>${loc}<br/>Cloud Disk / SAN`,
        tgtFile: (loc) => `📂 Target File<br/>${loc}<br/>NAS / File Service`,
        tgtObject: (loc) => `🪣 Target Object<br/>${loc}<br/>Bucket`,
        net: (mbps) => `🌐 Migration Network<br/>${mbps} Mbps`,
        edgeRead: "read",
        edgeWrite: "write",
      },
      recs: {
        archTitle: "Recommended architecture",
        archText: (p) =>
          `Use the "${p.source} → ${p.tool} → ${p.target}" path. ${p.protocol} data is transferred over ${p.parallelism} parallel channels into the target ${p.profileLabel}.`,
        smallFileTitle: "Small-file optimization",
        smallFileText: (mb) =>
          `Average file is ~${mb} MB. Consider packing files, raising parallelism, or a dedicated small-file accelerator to cut the metadata phase by 30%–50%.`,
        crossBorderTitle: "Cross-border / long-distance",
        crossBorderText:
          "Source and target are far apart geographically. Enable compression, use a nearby relay node, or migrate in phases (hot data first) to reduce window risk.",
        blockTitle: "Block storage notes",
        blockText:
          "Create a consistent snapshot before migration; plan RPO/RTO on the business side, and use dual-write or incremental sync to shorten the cutover window if needed.",
        objectTitle: "Object storage notes",
        objectText:
          "Map ACLs, version IDs and lifecycle policies; use multipart upload for large objects, with resumable transfer and a retry queue for failures.",
        fileTitle: "File storage notes",
        fileText:
          "Preserve UID/GID, ACLs and hard links; check NFS version compatibility, and run full + incremental sync during off-peak hours.",
        bandwidthTitle: "Bandwidth bottleneck",
        bandwidthText:
          "Data transfer dominates. Consider upgrading the dedicated line, aggregating multiple links, or deploying a cache node in the target region for intranet sync.",
      },
    },
  };

  function t() {
    return I18N[currentLang];
  }

  /* --------------------------- 数据模型定义 --------------------------- */

  // region 仅用于业务分组展示；country / isLocal 用于跨地域因子计算（语言无关）
  const LOCATIONS = [
    { id: "cn-north-beijing", zh: "中国 · 北京", en: "China · Beijing", country: "CN" },
    { id: "cn-east-shanghai", zh: "中国 · 上海", en: "China · Shanghai", country: "CN" },
    { id: "cn-south-guangzhou", zh: "中国 · 广州", en: "China · Guangzhou", country: "CN" },
    { id: "cn-southwest-chengdu", zh: "中国 · 成都", en: "China · Chengdu", country: "CN" },
    { id: "cn-northwest-xian", zh: "中国 · 西安", en: "China · Xi'an", country: "CN" },
    { id: "hk", zh: "中国 · 香港", en: "China · Hong Kong", country: "CN" },
    { id: "ap-southeast-sg", zh: "新加坡", en: "Singapore", country: "SG" },
    { id: "ap-northeast-tokyo", zh: "日本 · 东京", en: "Japan · Tokyo", country: "JP" },
    { id: "eu-west-frankfurt", zh: "德国 · 法兰克福", en: "Germany · Frankfurt", country: "DE" },
    { id: "us-east-virginia", zh: "美国 · 弗吉尼亚", en: "USA · Virginia", country: "US" },
    { id: "on-prem-idc", zh: "本地 IDC / 私有云", en: "On-prem IDC / Private Cloud", country: "CN", isLocal: true },
  ];

  const STORAGE_PROFILES = {
    block: {
      metadataPerFileSec: 0.002,
      transferEfficiency: 0.82,
      smallFilePenalty: 1.0,
      zh: {
        label: "块存储",
        protocol: "iSCSI / FC / NVMe-oF",
        migrationTool: "块级复制 / 存储快照同步",
        hint: "适合数据库、虚拟机磁盘；迁移以 LUN/卷为单位，元数据开销较低。",
      },
      en: {
        label: "Block Storage",
        protocol: "iSCSI / FC / NVMe-oF",
        migrationTool: "Block-level replication / snapshot sync",
        hint: "Best for databases and VM disks; migrated by LUN/volume with low metadata overhead.",
      },
    },
    file: {
      metadataPerFileSec: 0.045,
      transferEfficiency: 0.72,
      smallFilePenalty: 1.8,
      zh: {
        label: "文件存储",
        protocol: "NFS / SMB / CIFS",
        migrationTool: "文件同步服务 / rsync / 专用迁移网关",
        hint: "适合共享目录、内容库；大量小文件会显著增加元数据同步时间。",
      },
      en: {
        label: "File Storage",
        protocol: "NFS / SMB / CIFS",
        migrationTool: "File sync service / rsync / dedicated gateway",
        hint: "Best for shared directories and content libraries; many small files greatly increase metadata sync time.",
      },
    },
    object: {
      metadataPerFileSec: 0.018,
      transferEfficiency: 0.78,
      smallFilePenalty: 1.4,
      zh: {
        label: "对象存储",
        protocol: "S3 / OSS / OBS API",
        migrationTool: "对象迁移服务 / 数据同步工具",
        hint: "适合备份、静态资源、数据湖；支持多路并行与断点续传。",
      },
      en: {
        label: "Object Storage",
        protocol: "S3 / OSS / OBS API",
        migrationTool: "Object migration service / data sync tool",
        hint: "Best for backups, static assets and data lakes; supports parallel and resumable transfer.",
      },
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
    parallelismHint: document.getElementById("parallelismHint"),
    avgFileSizeHint: document.getElementById("avgFileSizeHint"),
    storageTypeHint: document.getElementById("storageTypeHint"),
    metrics: document.getElementById("metrics"),
    mermaidContainer: document.getElementById("mermaidContainer"),
    timeline: document.getElementById("timeline"),
    recommendations: document.getElementById("recommendations"),
    langToggle: document.getElementById("langToggle"),
  };

  function locLabel(loc) {
    return loc[currentLang];
  }

  function profileText(profile) {
    return profile[currentLang];
  }

  function populateLocationSelects() {
    const prevSource = els.sourceLocation.value || "on-prem-idc";
    const prevTarget = els.targetLocation.value || "cn-east-shanghai";
    const options = LOCATIONS.map(
      (loc) => `<option value="${loc.id}">${locLabel(loc)}</option>`
    ).join("");
    els.sourceLocation.innerHTML = options;
    els.targetLocation.innerHTML = options;
    els.sourceLocation.value = prevSource;
    els.targetLocation.value = prevTarget;
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
    const d = t().duration;
    if (!isFinite(seconds) || seconds < 0) return d.empty;
    if (seconds < 60) return d.sec(Math.ceil(seconds));
    if (seconds < 3600) return d.min(Math.ceil(seconds / 60));
    if (seconds < 86400) {
      const h = Math.floor(seconds / 3600);
      const m = Math.ceil((seconds % 3600) / 60);
      return d.hour(h, m);
    }
    const days = Math.floor(seconds / 86400);
    const h = Math.ceil((seconds % 86400) / 3600);
    return d.day(days, h);
  }

  function getLocation(id) {
    return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
  }

  function getRegionFactor(sourceId, targetId) {
    const source = getLocation(sourceId);
    const target = getLocation(targetId);
    if (sourceId === targetId) return CROSS_REGION_LATENCY.same;
    if (source.isLocal || target.isLocal) {
      return CROSS_REGION_LATENCY.onPremToCloud;
    }
    if (source.country === "CN" && target.country === "CN") {
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

  function buildMermaidDiagramFixed(input, result) {
    const type = input.storageType;
    const dg = t().diagram;
    const sourceLabel = locLabel(result.source).replace(/"/g, "'");
    const targetLabel = locLabel(result.target).replace(/"/g, "'");
    const tool = profileText(result.profile).migrationTool;

    const sourceText =
      type === "block"
        ? dg.srcBlock(sourceLabel)
        : type === "file"
          ? dg.srcFile(sourceLabel)
          : dg.srcObject(sourceLabel);

    const gatewayText =
      type === "block"
        ? dg.gwBlock(input.parallelism)
        : type === "file"
          ? dg.gwFile(tool, input.parallelism)
          : dg.gwObject(tool, input.parallelism);

    const targetText =
      type === "block"
        ? dg.tgtBlock(targetLabel)
        : type === "file"
          ? dg.tgtFile(targetLabel)
          : dg.tgtObject(targetLabel);

    const networkText = dg.net(Math.round(input.bandwidthMbps));

    return `flowchart LR
    SRC["${sourceText}"]
    GW["${gatewayText}"]
    TGT["${targetText}"]
    NET(("${networkText}"))

    SRC -->|"${dg.edgeRead}"| GW
    GW --> NET
    NET -->|"${dg.edgeWrite}"| TGT

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
    const L = t();

    els.metrics.innerHTML = `
      <div class="metric-card metric-card--primary">
        <div class="metric-card__label">${L.metricBuffered}</div>
        <div class="metric-card__value">${formatDuration(result.bufferedSeconds)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__label">${L.metricBase}</div>
        <div class="metric-card__value">${formatDuration(result.totalSeconds)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__label">${L.metricThroughput}</div>
        <div class="metric-card__value">${result.effectiveMbps.toFixed(0)} Mbps</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__label">${L.metricPerHour(throughputTBh.toFixed(2))}</div>
        <div class="metric-card__value">${formatBytes(result.dataBytes)}</div>
      </div>
    `;
  }

  function renderTimeline(result) {
    const L = t();
    const phases = [
      { label: L.phaseSetup, seconds: result.setupSeconds, cls: "setup" },
      { label: L.phaseTransfer, seconds: result.transferSeconds, cls: "transfer" },
      { label: L.phaseMetadata, seconds: result.metadataSeconds, cls: "metadata" },
      { label: L.phaseValidation, seconds: result.validationSeconds, cls: "validation" },
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
    const R = t().recs;
    const recs = [];
    const avgMB = result.avgFileSize / (1024 * 1024);
    const profileText_ = profileText(result.profile);

    recs.push({
      title: R.archTitle,
      text: R.archText({
        source: locLabel(result.source),
        target: locLabel(result.target),
        tool: profileText_.migrationTool,
        protocol: profileText_.protocol,
        parallelism: input.parallelism,
        profileLabel: profileText_.label,
      }),
    });

    if (avgMB < 1 && input.storageType !== "block") {
      recs.push({
        title: R.smallFileTitle,
        text: R.smallFileText(avgMB < 0.01 ? "< 0.01" : avgMB.toFixed(2)),
      });
    }

    if (result.regionFactor >= CROSS_REGION_LATENCY.crossBorder) {
      recs.push({ title: R.crossBorderTitle, text: R.crossBorderText });
    }

    if (input.storageType === "block") {
      recs.push({ title: R.blockTitle, text: R.blockText });
    } else if (input.storageType === "object") {
      recs.push({ title: R.objectTitle, text: R.objectText });
    } else {
      recs.push({ title: R.fileTitle, text: R.fileText });
    }

    const bwRatio = result.transferSeconds / result.totalSeconds;
    if (bwRatio > 0.7) {
      recs.push({ title: R.bandwidthTitle, text: R.bandwidthText });
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
      t().avgFileSizePrefix + formatBytes(result.avgFileSize);
    els.storageTypeHint.textContent = profileText(result.profile).hint;
    els.parallelismHint.textContent = t().parallelHint(input.parallelism);
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
        '<p style="color:#f59e0b;padding:20px;">' + t().diagramFailed + "</p>";
    });
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 120);
  }

  /* ----------------------------- 语言切换 ----------------------------- */

  function applyStaticI18n() {
    const L = t();
    document.documentElement.lang = L.htmlLang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (L[key] != null) el.textContent = L[key];
    });
    els.langToggle.textContent = L.toggle;
  }

  function setLanguage(lang) {
    currentLang = I18N[lang] ? lang : "zh";
    try {
      localStorage.setItem(STORAGE_KEY, currentLang);
    } catch (e) {
      /* localStorage 不可用时静默降级 */
    }
    applyStaticI18n();
    populateLocationSelects();
    render();
  }

  function initLanguage() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    if (stored && I18N[stored]) {
      currentLang = stored;
    } else if (typeof navigator !== "undefined" && navigator.language) {
      currentLang = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    }
  }

  function bindEvents() {
    const form = document.getElementById("evalForm");
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(function (el) {
      el.addEventListener("input", scheduleRender);
      el.addEventListener("change", scheduleRender);
    });
    els.parallelism.addEventListener("input", function () {
      els.parallelismHint.textContent = t().parallelHint(els.parallelism.value);
    });
    els.langToggle.addEventListener("click", function () {
      setLanguage(currentLang === "zh" ? "en" : "zh");
    });
  }

  /* ------------------------------- 启动 ------------------------------- */

  initLanguage();
  populateLocationSelects();
  els.sourceLocation.value = "on-prem-idc";
  els.targetLocation.value = "cn-east-shanghai";
  applyStaticI18n();
  bindEvents();
  render();
})();
