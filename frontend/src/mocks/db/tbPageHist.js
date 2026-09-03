// Mock rows shaped after the real `tb_page_hist` DDL.
// Only the columns the UI actually reads are populated with real content;
// `props` (the full editor-state blob) is intentionally omitted — the
// history/diff views only ever need css_code + lc_before_load/lc_loaded/lc_before_unload.

const NOC_PAGE_ID = "id860c329c-43644dafb158-cbe2214e77ba";
const NOC_PARENT_ID = "wv_root";
const NOC_PREV_ID = "ida9de9a5c-a84248918b90-62885b7b0c42";

const SUB_PAGE_ID = "id7a21f4b0-9e2a41c7b3d5-4f6e8a1c2b9d";

export default [
  {
    hist_id: 27,
    page_id: NOC_PAGE_ID,
    name: "TelecomNocDashboardStandalone",
    page_type: "page",
    version: "3.7.0",
    secret: "N",
    reg_dt: "2026-08-15T01:20:00.000Z",
    parent_id: NOC_PARENT_ID,
    prev_id: NOC_PREV_ID,
    last_user: "kim.dev",
    locked_yn: "N",
    comment: "NOC 대시보드 초기 스캐폴딩 — 정적 목업 데이터로 레이아웃만 구성",
    css_code: `.id860c329c-43644dafb158-cbe2214e77ba {
    .twoLayer {
        background: #0b0d16;
    }
}
`,
    lc_before_load: `const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@nodeSelected': ({ event }) => {
        const node = event.target.closest('.asset-tree__node');
        if (!node) return;
        console.log('selected', node.dataset.nodeId);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
`,
    lc_loaded: `const { publish } = GlobalDataPublisher;

// TODO: replace static mock with live sim
publish('ncSummary', {
    response: {
        availabilityPct: '100.0',
        trafficGbps: '0',
        devicesOnline: '18 / 18'
    }
});
`,
    lc_before_unload: `const { offEventBusHandlers } = Wkit;

if (this.pageEventBusHandlers) offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;
`,
  },
  {
    hist_id: 28,
    page_id: NOC_PAGE_ID,
    name: "TelecomNocDashboardStandalone",
    page_type: "page",
    version: "3.8.0",
    secret: "N",
    reg_dt: "2026-08-21T06:05:00.000Z",
    parent_id: NOC_PARENT_ID,
    prev_id: NOC_PREV_ID,
    last_user: "kim.dev",
    locked_yn: "N",
    comment:
      "장애 시뮬레이션 붙이기 전, 알람/트리 선택 이벤트 릴레이와 기본 요약 퍼블리셔 추가",
    css_code: `.id860c329c-43644dafb158-cbe2214e77ba {
    .twoLayer {
        background: #0b0d16;
    }
}
`,
    lc_before_load: `const { onEventBusHandlers } = Wkit;
const { publish } = GlobalDataPublisher;

this.selectNode = (nodeId) => {
    if (!nodeId) return;
    this._selectedNodeId = nodeId;
    publish('ncSelect', { response: { id: nodeId } });
};

this.pageEventBusHandlers = {
    '@nodeSelected': ({ event }) => {
        const node = event.target.closest('.asset-tree__node');
        const nodeId = node && node.dataset.nodeId;
        if (!nodeId) return;
        this.selectNode(nodeId);
    },
    '@alarmPicked': ({ event }) => {
        const item = event.target.closest('.alarm-feed__item');
        const nodeId = item && item.dataset.target;
        if (!nodeId) return;
        this.selectNode(nodeId);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
`,
    lc_loaded: `const { publish } = GlobalDataPublisher;

this._selectedNodeId = 'S1R1D1';

const summary = () => ({
    availabilityPct: '100.0',
    trafficGbps: '4820',
    devicesOnline: '18 / 18',
    sysStatus: 'normal',
    sysStatusLabel: 'STABLE'
});

publish('ncSummary', { response: summary() });

this.summaryTimer = setInterval(() => {
    publish('ncSummary', { response: summary() });
}, 3000);
`,
    lc_before_unload: `const { offEventBusHandlers } = Wkit;

clearInterval(this.summaryTimer);
this.summaryTimer = null;

if (this.pageEventBusHandlers) offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;
this.selectNode = null;
`,
  },
  {
    hist_id: 29,
    page_id: NOC_PAGE_ID,
    name: "TelecomNocDashboardStandalone",
    page_type: "page",
    version: "3.9.0",
    secret: "N",
    reg_dt: "2026-08-25T04:47:11.675Z",
    parent_id: NOC_PARENT_ID,
    prev_id: NOC_PREV_ID,
    last_user: "admin",
    locked_yn: "N",
    comment: "",
    css_code: `.id860c329c-43644dafb158-cbe2214e77ba {
    .twoLayer {
        background: radial-gradient(circle at 18% 0%, rgba(124, 108, 255, 0.13) 0%, rgba(8, 10, 22, 0) 45%), #080A16;
    }
}
`,
    lc_before_load: `const { onEventBusHandlers } = Wkit;
const { publish } = GlobalDataPublisher;

this.selectNode = (nodeId) => {
    if (!nodeId || !this.nocSim) return;
    this._selectedNodeId = nodeId;
    publish('ncSelect', { response: { id: nodeId } });
    publish('ncNodeDetail', { response: this.nocSim.detail(nodeId) });
    publish('ncTrend', { response: this.nocSim.trend(nodeId) });
};

this.pageEventBusHandlers = {
    '@nodeToggled': ({ targetInstance, event }) => {
        const node = event.target.closest('.asset-tree__node');
        const nodeId = node && node.dataset.nodeId;
        if (!nodeId) return;
        targetInstance.treeRender.toggle(nodeId);
    },
    '@nodeSelected': ({ event }) => {
        if (event.target.closest('.asset-tree__toggle')) return;
        const node = event.target.closest('.asset-tree__node');
        const nodeId = node && node.dataset.nodeId;
        if (!nodeId) return;
        this.selectNode(nodeId);
    },
    '@alarmPicked': ({ event }) => {
        const item = event.target.closest('.alarm-feed__item');
        const nodeId = item && item.dataset.target;
        if (!nodeId) return;
        this.selectNode(nodeId);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
`,
    lc_loaded: `const { publish } = GlobalDataPublisher;
const { each, go } = fx;

const DEFAULT_NODE = 'S1R1D1';
this._selectedNodeId = DEFAULT_NODE;

this.nocSim = (() => {
    const SITES = [
        { id: 'S1', name: 'CO-WEST',  region: 'Metro Core West' },
        { id: 'S2', name: 'CO-EAST',  region: 'Metro Core East' },
        { id: 'S3', name: 'CO-SOUTH', region: 'Access Hub South' }
    ];

    const RACKS = [
        { id: 'S1R1', site: 'S1', name: 'RACK A-01' },
        { id: 'S1R2', site: 'S1', name: 'RACK A-02' },
        { id: 'S2R1', site: 'S2', name: 'RACK B-01' },
        { id: 'S2R2', site: 'S2', name: 'RACK B-02' },
        { id: 'S3R1', site: 'S3', name: 'RACK C-01' },
        { id: 'S3R2', site: 'S3', name: 'RACK C-02' }
    ];

    const DEVICES = [
        { id: 'S1R1D1', rack: 'S1R1', name: 'CORE-RTR-01', kind: 'router', capacityGbps: 400, ports: 8, seed: 0 },
        { id: 'S1R1D2', rack: 'S1R1', name: 'AGG-SW-01',   kind: 'switch', capacityGbps: 200, ports: 8, seed: 1 },
        { id: 'S1R1D3', rack: 'S1R1', name: 'DWDM-TR-01',  kind: 'dwdm',   capacityGbps: 800, ports: 4, seed: 2 }
        // … remaining 15 devices across S1R2/S2R1/S2R2/S3R1/S3R2 omitted for mock brevity
    ];

    const SITE_OF = Object.fromEntries(SITES.map(s => [s.id, s]));
    const RACK_OF = Object.fromEntries(RACKS.map(r => [r.id, r]));
    const DEVICE_OF = Object.fromEntries(DEVICES.map(d => [d.id, d]));
    const STATUS_LABEL = { normal: 'OK', warning: 'WARN', critical: 'CRIT', down: 'DOWN' };
    const STATUS_RANK = { normal: 0, warning: 1, critical: 2, down: 3 };
    const worstOf = (a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a);

    // ── Waveforms + scripted fault (degrade → down) ──
    const START = Date.now();
    const TWO_PI = Math.PI * 2;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    const FAULT_WINDOW = 120;
    const DEGRADE_START = 45;
    const DOWN_START = 75;

    function faultAt(sec) {
        const offset = ((sec % FAULT_WINDOW) + FAULT_WINDOW) % FAULT_WINDOW;
        if (offset < DEGRADE_START) return null;
        const cycle = Math.floor(sec / FAULT_WINDOW);
        const deviceIndex = ((cycle % DEVICES.length) + DEVICES.length) % DEVICES.length;
        if (offset < DOWN_START) {
            return { deviceIndex, phase: 'degrade', progress: (offset - DEGRADE_START) / (DOWN_START - DEGRADE_START) };
        }
        return { deviceIndex, phase: 'down', progress: 1 };
    }

    function deviceStateAt(dev, index, sec) {
        const s = dev.seed;
        const fault = faultAt(sec);
        const isTarget = fault && fault.deviceIndex === index;

        let util = 0.55
            + 0.16 * Math.sin(TWO_PI * (sec / (360 + s * 40) + s * 0.13))
            + 0.09 * Math.sin(TWO_PI * (sec / (110 + s * 7) + s * 0.71));
        let err = 0.05 + 0.05 * (1 + Math.sin(TWO_PI * (sec / (300 + s * 30) + s * 0.37)));

        const down = !!(isTarget && fault.phase === 'down');
        if (isTarget && fault.phase === 'degrade') err += 2.6 * fault.progress;

        util = clamp(util, 0.2, 0.97);
        err = down ? 0 : clamp(err, 0.02, 4);
        const trafficGbps = down ? 0 : dev.capacityGbps * util;
        const status = down ? 'down'
            : err >= 2 ? 'critical'
            : (err >= 0.8 || util >= 0.92) ? 'warning'
            : 'normal';

        return { id: dev.id, down, util, errPct: err, trafficGbps, status };
    }

    function rollupOf(children) {
        const traffic = children.reduce((acc, c) => acc + c.trafficGbps, 0);
        const alive = children.filter(c => !c.down);
        const err = alive.length ? alive.reduce((acc, c) => acc + c.errPct, 0) / alive.length : 0;
        const status = children.reduce((acc, c) => worstOf(acc, c.status), 'normal');
        return { trafficGbps: traffic, errPct: err, status, upCount: alive.length, total: children.length };
    }

    function stateAt(t) {
        const sec = (t - START) / 1000;
        const devices = DEVICES.map((dev, i) => deviceStateAt(dev, i, sec));
        const byId = Object.fromEntries(devices.map(d => [d.id, d]));
        const racks = Object.fromEntries(RACKS.map(r => [r.id, rollupOf(devices.filter(d => DEVICE_OF[d.id].rack === r.id))]));
        const sites = Object.fromEntries(SITES.map(st => [st.id, rollupOf(devices.filter(d => RACK_OF[DEVICE_OF[d.id].rack].site === st.id))]));
        return { t, devices, byId, racks, sites };
    }

    // ── Alarms — created on status transitions, ring buffer ──
    const alarmList = [];
    let alarmSeq = 7000;
    const lastStatus = new Map();

    function recordTransitions(state) {
        state.devices.forEach(ds => {
            const dev = DEVICE_OF[ds.id];
            const prev = lastStatus.get(ds.id);
            if (prev && prev !== ds.status) {
                alarmList.unshift({
                    id: \`AL-\${++alarmSeq}\`,
                    severity: ds.status === 'down' ? 'critical' : 'minor',
                    source: dev.name,
                    message: ds.status === 'down' ? 'Heartbeat lost — device unreachable' : \`Error rate \${ds.errPct.toFixed(2)}%\`,
                    targetId: ds.id
                });
                if (alarmList.length > 30) alarmList.length = 30;
            }
            lastStatus.set(ds.id, ds.status);
        });
    }

    function snapshot() {
        const state = stateAt(Date.now());
        recordTransitions(state);
        return state;
    }

    function summaryOf(state) {
        const downCount = state.devices.filter(d => d.status === 'down').length;
        const upCount = DEVICES.length - downCount;
        const traffic = state.devices.reduce((acc, d) => acc + d.trafficGbps, 0);
        return {
            availabilityPct: (upCount / DEVICES.length * 100).toFixed(1),
            trafficGbps: Math.round(traffic).toLocaleString('en-US'),
            devicesOnline: \`\${upCount} / \${DEVICES.length}\`,
            sysStatus: downCount > 0 ? 'critical' : 'normal',
            sysStatusLabel: downCount > 0 ? 'FAULT ACTIVE' : 'STABLE'
        };
    }

    function detailOf(id, state) {
        const dev = DEVICE_OF[id];
        if (!dev) return null;
        const ds = state.byId[id];
        return {
            id,
            name: dev.name,
            status: ds.status,
            statusLabel: STATUS_LABEL[ds.status],
            stats: [
                { label: 'Traffic', value: \`\${Math.round(ds.trafficGbps)} Gbps\` },
                { label: 'Error rate', value: \`\${ds.errPct.toFixed(2)} %\` }
            ]
        };
    }

    return {
        summary() { return summaryOf(snapshot()); },
        detail(id) { return detailOf(id, snapshot()); },
        trend(id) { return { targetId: id }; },
        alarms() { snapshot(); return alarmList.slice(0, 20); }
    };
})();

this.pagePublishers = [
    { topic: 'ncSummary',    data: () => this.nocSim.summary(),                    refreshInterval: 3000 },
    { topic: 'ncAlarms',     data: () => this.nocSim.alarms(),                     refreshInterval: 5000 },
    { topic: 'ncNodeDetail', data: () => this.nocSim.detail(this._selectedNodeId), refreshInterval: 5000 },
    { topic: 'ncTrend',      data: () => this.nocSim.trend(this._selectedNodeId),  refreshInterval: 5000 }
];

go(this.pagePublishers, each(({ topic, data }) => publish(topic, { response: data() })));
publish('ncSelect', { response: { id: this._selectedNodeId } });

this.pageIntervals = {};

this.startAllIntervals = () => {
    go(this.pagePublishers, each(({ topic, data, refreshInterval }) => {
        const state = { _stopped: false, _timerId: null };
        this.pageIntervals[topic] = state;

        const scheduleNext = () => {
            if (state._stopped) return;
            state._timerId = setTimeout(() => {
                try {
                    publish(topic, { response: data() });
                } catch (err) {
                    console.error(\`[Page] \${topic} simulation publish failed:\`, err);
                }
                scheduleNext();
            }, refreshInterval);
        };
        scheduleNext();
    }));
};

this.stopAllIntervals = () => {
    go(Object.entries(this.pageIntervals || {}), each(([_, state]) => {
        state._stopped = true;
        clearTimeout(state._timerId);
    }));
};

this.startAllIntervals();
`,
    lc_before_unload: `const { offEventBusHandlers } = Wkit;

// ── Timer cleanup ──
if (this.stopAllIntervals) {
    this.stopAllIntervals();
}
this.pageIntervals = null;
this.startAllIntervals = null;
this.stopAllIntervals = null;
this.pagePublishers = null;

// ── Event bus cleanup ──
if (this.pageEventBusHandlers) offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;
this.selectNode = null;

// ── Simulation cleanup ──
this.nocSim = null;
this._selectedNodeId = null;
`,
  },
  {
    hist_id: 30,
    page_id: SUB_PAGE_ID,
    name: "SubstationOverview",
    page_type: "page",
    version: "1.2.0",
    secret: "N",
    reg_dt: "2026-08-30T09:12:00.000Z",
    parent_id: "wv_root",
    prev_id: NOC_PAGE_ID,
    last_user: "park.ops",
    locked_yn: "N",
    comment: "온도 임계치 알람 색상 로직 수정",
    css_code: `.id7a21f4b0-9e2a41c7b3d5-4f6e8a1c2b9d {
    .twoLayer {
        background: linear-gradient(180deg, #101820 0%, #06090c 100%);
    }
}
`,
    lc_before_load: `const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@thresholdChanged': ({ event }) => {
        const value = Number(event.target.value);
        GlobalDataPublisher.publish('subThreshold', { response: { celsius: value } });
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
`,
    lc_loaded: `const { publish } = GlobalDataPublisher;

const THRESHOLD_WARN = 65;
const THRESHOLD_CRIT = 80;

this.tempTimer = setInterval(() => {
    const celsius = 55 + Math.random() * 30;
    const status = celsius >= THRESHOLD_CRIT ? 'critical'
        : celsius >= THRESHOLD_WARN ? 'warning'
        : 'normal';

    publish('subTemperature', {
        response: { celsius: celsius.toFixed(1), status }
    });
}, 4000);
`,
    lc_before_unload: `const { offEventBusHandlers } = Wkit;

clearInterval(this.tempTimer);
this.tempTimer = null;

if (this.pageEventBusHandlers) offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;
`,
  },
];
