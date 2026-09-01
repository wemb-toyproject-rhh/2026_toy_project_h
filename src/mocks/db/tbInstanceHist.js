// Mock rows shaped after the real `tb_instance_hist` DDL.
// Note the schema asymmetry vs tb_page_hist: no `last_user`, no `version` —
// the adapter respects that (instance entries show no author/version).

const NOC_PAGE_ID = "id860c329c-43644dafb158-cbe2214e77ba";

const RACK_CARD_INST_ID = "inst-3f7a9c21-rack-status-card";
const RACK_3D_INST_ID = "inst-8b2e14d6-rack-aisle-3d";

export default [
  {
    hist_id: 15,
    inst_id: RACK_CARD_INST_ID,
    layer_name: "twoLayer",
    category: "2D",
    page_id: NOC_PAGE_ID,
    comp_name: "RackStatusCard",
    name: "Rack Status Card",
    group_id: null,
    asset_id: null,
    reg_dt: "2026-08-16T03:30:00.000Z",
    comment: "카드 초기 레이아웃 및 상태 배지",
    html_code: `<div class="rack-card">
  <div class="rack-card__title" data-bind="name"></div>
  <div class="rack-card__badge" data-bind="status"></div>
</div>
`,
    css_code: `.rack-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #12161f;
    border: 1px solid #232a36;
    border-radius: 6px;
}
.rack-card__badge {
    font-size: 11px;
    font-weight: 700;
    color: #9aa1ac;
}
`,
    lc_register: `this.render = (data) => {
    this.el.querySelector('[data-bind="name"]').textContent = data.name;
    this.el.querySelector('[data-bind="status"]').textContent = data.statusLabel;
};
`,
    lc_complete: `GlobalDataPublisher.subscribe('ncNodeDetail', (msg) => {
    this.render(msg.response);
});
`,
    lc_before_destroy: "",
    lc_destroy: `GlobalDataPublisher.unsubscribe('ncNodeDetail', this.render);
`,
    lc_completed: "",
    lc_preview: `this.render({ name: 'CORE-RTR-01', statusLabel: 'OK' });
`,
  },
  {
    hist_id: 16,
    inst_id: RACK_CARD_INST_ID,
    layer_name: "twoLayer",
    category: "2D",
    page_id: NOC_PAGE_ID,
    comp_name: "RackStatusCard",
    name: "Rack Status Card",
    group_id: null,
    asset_id: null,
    reg_dt: "2026-08-23T08:10:00.000Z",
    comment: "상태별 배지 색상 매핑 추가",
    html_code: `<div class="rack-card">
  <div class="rack-card__title" data-bind="name"></div>
  <div class="rack-card__badge" data-bind="status"></div>
</div>
`,
    css_code: `.rack-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #12161f;
    border: 1px solid #232a36;
    border-radius: 6px;
}
.rack-card__badge {
    font-size: 11px;
    font-weight: 700;
    color: #9aa1ac;
}
`,
    lc_register: `this.render = (data) => {
    this.el.querySelector('[data-bind="name"]').textContent = data.name;
    this.el.querySelector('[data-bind="status"]').textContent = data.statusLabel;
};
`,
    lc_complete: `const STATUS_COLOR = {
    normal: '#2f9e44',
    warning: '#f08c00',
    critical: '#e03131',
    down: '#868e96'
};

GlobalDataPublisher.subscribe('ncNodeDetail', (msg) => {
    this.render(msg.response);
    const badge = this.el.querySelector('[data-bind="status"]');
    badge.style.color = STATUS_COLOR[msg.response.status] || STATUS_COLOR.normal;
});
`,
    lc_before_destroy: "",
    lc_destroy: `GlobalDataPublisher.unsubscribe('ncNodeDetail', this.render);
`,
    lc_completed: "",
    lc_preview: `this.render({ name: 'CORE-RTR-01', statusLabel: 'OK' });
`,
  },
  {
    hist_id: 8,
    inst_id: RACK_3D_INST_ID,
    layer_name: "threeLayer",
    category: "3D",
    page_id: NOC_PAGE_ID,
    comp_name: "RackAisle3DModel",
    name: "Rack Aisle 3D Model",
    group_id: null,
    asset_id: "asset-gltf-rack-aisle-01",
    reg_dt: "2026-08-10T05:00:00.000Z",
    comment: "3D 랙 모델 최초 등록",
    html_code: "",
    css_code: "",
    lc_register: `this.mesh = this.loadModel('/assets/gltf/rack_aisle.gltf');
this.scene.add(this.mesh);
`,
    lc_complete: "",
    lc_before_destroy: "",
    lc_destroy: `this.scene.remove(this.mesh);
this.mesh.geometry.dispose();
this.mesh.material.dispose();
`,
    lc_completed: "",
    lc_preview: "",
  },
  {
    hist_id: 9,
    inst_id: RACK_3D_INST_ID,
    layer_name: "threeLayer",
    category: "3D",
    page_id: NOC_PAGE_ID,
    comp_name: "RackAisle3DModel",
    name: "Rack Aisle 3D Model",
    group_id: null,
    asset_id: "asset-gltf-rack-aisle-01",
    reg_dt: "2026-08-24T07:45:00.000Z",
    comment: "라이트 재질 갱신 대응 코드 반영",
    html_code: "",
    css_code: "",
    lc_register: `this.mesh = this.loadModel('/assets/gltf/rack_aisle.gltf');
this.mesh.traverse((node) => {
    if (node.isMesh) node.material.needsUpdate = true;
});
this.scene.add(this.mesh);
`,
    lc_complete: "",
    lc_before_destroy: "",
    lc_destroy: `this.scene.remove(this.mesh);
this.mesh.geometry.dispose();
this.mesh.material.dispose();
`,
    lc_completed: "",
    lc_preview: "",
  },
];
