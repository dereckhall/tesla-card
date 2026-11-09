import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { TeslaBase } from './tesla-base.js';

import { sharedStyles, chargerStyles } from './styles.js';
import { ICONS } from './icons.js';

class TeslaMenuCharger extends TeslaBase {

  static get properties() {
    return {
      ...super.properties,
      _pendingLimit: { state: true },
      _pendingAmps:  { state: true },
    };
  }

  static get styles() { return [sharedStyles, chargerStyles]; }

  constructor() {
    super();
    this._pendingLimit = null;
    this._pendingAmps  = null;
  }

  // ── Slider helpers ────────────────────────────────────────────────────────

  _pct(v, mn, mx) { return Math.round(((v - mn) / (mx - mn)) * 100); }

  _onLimitInput(e) {
    e.target.style.setProperty('--pct', `${this._pct(+e.target.value, +e.target.min, +e.target.max)}%`);
    this._pendingLimit = +e.target.value;
  }

  _onLimitChange(e) {
    this._pendingLimit = null;
    // Click-stop at 80 % (the daily-charging limit): within 2 % snaps to it
    let v = +e.target.value;
    if (Math.abs(v - 80) <= 2) v = 80;
    this._svc('number', 'set_value', this.E.CHARGE_LIMIT_NUMBER, { value: v });
  }

  _num(t) {
    const v = this._val(t);
    if (v == null || v === 'unknown' || v === 'unavailable' || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  _onAmpsInput(e) {
    e.target.style.setProperty('--pct', `${this._pct(+e.target.value, +e.target.min, +e.target.max)}%`);
    this._pendingAmps = +e.target.value;
  }

  _onAmpsChange(e) {
    this._pendingAmps = null;
    this._svc('number', 'set_value', this.E.CHARGING_AMPS_NUMBER, { value: +e.target.value });
  }

  _adjustAmps(delta) {
    const step = this._nattr(this.E.CHARGING_AMPS_NUMBER, 'step') ?? 1;
    const min  = this._nattr(this.E.CHARGING_AMPS_NUMBER, 'min')  ?? 5;
    const max  = this._nattr(this.E.CHARGING_AMPS_NUMBER, 'max')  ?? 32;
    const cur  = this._pendingAmps ?? Number(this._val(this.E.CHARGING_AMPS_NUMBER) ?? 16);
    this._pendingAmps = Math.max(min, Math.min(max, cur + delta * step));
    clearTimeout(this._ampsTimer);
    this._ampsTimer = setTimeout(() => {
      this._svc('number', 'set_value', this.E.CHARGING_AMPS_NUMBER, { value: this._pendingAmps });
      this._pendingAmps = null;
    }, 800);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this.config || !this.hass) return html``;

    const rangeRaw  = this._val(this.E.BATTERY_RANGE);
    const rangeUnit = this._attr(this.E.BATTERY_RANGE, 'unit_of_measurement') ?? 'km';
    const range     = rangeRaw != null ? `${Math.round(Number(rangeRaw))} ${rangeUnit}` : null;

    const chargerDoorOpen = this._val(this.E.CHARGER_DOOR) === 'open'
                         || this._val(this.E.PLUGGED_IN)    === 'on';

    const limitVal  = this._pendingLimit ?? Number(this._val(this.E.CHARGE_LIMIT_NUMBER) ?? 80);
    const limitMin  = this._nattr(this.E.CHARGE_LIMIT_NUMBER, 'min')  ?? 50;
    const limitMax  = this._nattr(this.E.CHARGE_LIMIT_NUMBER, 'max')  ?? 100;
    const limitStep = this._nattr(this.E.CHARGE_LIMIT_NUMBER, 'step') ?? 1;
    const limitPct  = this._pct(limitVal, limitMin, limitMax);

    const ampsVal   = this._pendingAmps ?? Number(this._val(this.E.CHARGING_AMPS_NUMBER) ?? 16);
    const ampsMin   = this._nattr(this.E.CHARGING_AMPS_NUMBER, 'min') ?? 5;
    const ampsMax   = this._nattr(this.E.CHARGING_AMPS_NUMBER, 'max') ?? 32;

    const addedRange = this._attr(this.E.ENERGY_ADDED, 'added_range');
    const tick80     = limitMin < 80 && limitMax > 80 ? this._pct(80, limitMin, limitMax) : null;

    // Live charging readouts (shown while the cable is in)
    const pluggedIn  = this._val(this.E.PLUGGED_IN) === 'on';
    const stateRaw   = this._val(this.E.CHARGING_STATE);
    const charging   = this._val(this.E.CHARGING) === 'on'
                    || String(stateRaw ?? '').toLowerCase() === 'charging';
    const stateText  = stateRaw && !['unknown', 'unavailable'].includes(stateRaw)
      ? (/^complete$/i.test(stateRaw) ? 'Charging complete'
        : stateRaw.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())) : null;
    const power      = this._num(this.E.CHARGER_POWER) ?? this._num(this.E.CHARGE_RATE);
    const amps       = this._num(this.E.CHARGER_CURRENT);
    const volts      = this._num(this.E.CHARGER_VOLTAGE);
    const kwh        = this._num(this.E.ENERGY_ADDED);
    const stats = [
      [power != null ? power.toFixed(1) : '—', 'kW'],
      [amps  != null ? Math.round(amps)  : '—', 'A'],
      [volts != null ? Math.round(volts) : '—', 'V'],
      [kwh   != null ? kwh.toFixed(1)    : '—', 'kWh added'],
    ];
    const armed = this._armed === 'charge';

    return html`
      <div class="charger-menu${this.layout === 'landscape' ? ' landscape' : ''}">

        <!-- Header: "Charging" + range subtitle -->
        <div class="panel-header">
          <button class="panel-back" @click=${this._close}>
            <span class="icon">${unsafeHTML(ICONS['chevron-left'])}</span>
          </button>
          <div class="panel-title-block">
            <span class="panel-title">Charging</span>
            ${range ? html`<span class="panel-subtitle">${range}</span>` : ''}
          </div>
        </div>

        ${pluggedIn ? html`
          <!-- Live charging: state, kW / A / V / kWh, start-stop -->
          <div class="chg-card chg-live">
            <div class="chg-live-head">
              <span class="chg-live-state${charging ? ' on' : ''}">${stateText ?? (charging ? 'Charging' : 'Plugged in')}</span>
            </div>
            <div class="chg-stats">
              ${stats.map(([v, u]) => html`
                <div class="chg-stat"><span class="chg-stat-val">${v}</span><span class="chg-stat-unit">${u}</span></div>`)}
            </div>
            <button class="chg-toggle${charging ? ' stop' : ''}${armed ? ' armed' : ''}"
              @click=${() => this._confirmTap('charge',
                () => this._svc('switch', charging ? 'turn_off' : 'turn_on', this.E.CHARGER_SWITCH))}>
              ${armed ? 'Tap again to confirm' : charging ? 'Stop Charging' : 'Start Charging'}
            </button>
          </div>` : ''}

        <!-- Charge limit card + amps stepper -->
        <div class="chg-card">
          <div class="chg-limit-header">
            <span class="chg-limit-title">Charge limit: ${limitVal}%</span>
            ${addedRange ? html`
              <p class="chg-limit-sub">${addedRange} ${rangeUnit} added during last charging session</p>` : ''}
          </div>

          <!-- Green pill slider for charge limit (tick + click-stop at 80 %) -->
          <div class="chg-slider-wrap">
          ${tick80 != null ? html`<span class="chg-tick" style="left:calc(11px + (100% - 22px) * ${tick80 / 100})"></span>` : ''}
          <input type="range" class="chg-slider" style="--pct:${limitPct}%"
            min=${limitMin} max=${limitMax} step=${limitStep}
            .value=${String(limitVal)}
            @input=${this._onLimitInput} @change=${this._onLimitChange}/>
          </div>

          <!-- Amps stepper row -->
          <div class="chg-amps-row">
            <button class="chg-amps-btn"
              ?disabled=${ampsVal <= ampsMin}
              @click=${() => this._adjustAmps(-1)}>
              <span class="icon">${unsafeHTML(ICONS['chevron-left'])}</span>
            </button>
            <span class="chg-amps-value">${ampsVal} A</span>
            <button class="chg-amps-btn"
              ?disabled=${ampsVal >= ampsMax}
              @click=${() => this._adjustAmps(+1)}>
              <span class="icon">${unsafeHTML(ICONS['chevron-right'])}</span>
            </button>
          </div>
        </div>

        <!-- Open / Close Charge Port — plain text link -->
        <button class="chg-port-btn"
          @click=${() => this._openClose(this.E.CHARGE_PORT_OPEN, this.E.CHARGE_PORT_CLOSE, chargerDoorOpen)}>
          ${chargerDoorOpen ? 'Close Charge Port' : 'Open Charge Port'}
        </button>

      </div>
    `;
  }
}

customElements.define('tesla-menu-charger', TeslaMenuCharger);
