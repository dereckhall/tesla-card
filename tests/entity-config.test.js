import { describe, it, expect } from 'vitest';
import {
  entityId,
  resolveEntityId,
  getEntities,
  ENTITY_GROUPS,
} from '../src/entity-config.js';

// ── entityId() ─────────────────────────────────────────────────────────────

describe('entityId', () => {
  it('replaces {car_name} with the provided name', () => {
    expect(entityId('sensor.{car_name}_battery_level', 'terrance'))
      .toBe('sensor.terrance_battery_level');
  });

  it('lowercases the car name', () => {
    expect(entityId('sensor.{car_name}_speed', 'MyTesla'))
      .toBe('sensor.mytesla_speed');
  });

  it('returns null for null template', () => {
    expect(entityId(null, 'terrance')).toBeNull();
  });

  it('returns null for undefined template', () => {
    expect(entityId(undefined, 'terrance')).toBeNull();
  });

  it('handles empty car_name gracefully', () => {
    expect(entityId('sensor.{car_name}_speed', ''))
      .toBe('sensor._speed');
  });

  it('handles null car_name gracefully', () => {
    expect(entityId('sensor.{car_name}_speed', null))
      .toBe('sensor._speed');
  });

  it('handles undefined car_name gracefully', () => {
    expect(entityId('sensor.{car_name}_speed', undefined))
      .toBe('sensor._speed');
  });
});

// ── resolveEntityId() ──────────────────────────────────────────────────────

describe('resolveEntityId', () => {
  it('works like entityId when no overrides', () => {
    expect(resolveEntityId('sensor.{car_name}_battery_level', 'terrance'))
      .toBe('sensor.terrance_battery_level');
  });

  it('returns null for null template', () => {
    expect(resolveEntityId(null, 'terrance')).toBeNull();
  });

  it('applies a direct entity override by canonical key', () => {
    const overrides = { BATTERY_LEVEL: 'sensor.custom_bat' };
    expect(resolveEntityId('sensor.{car_name}_battery_level', 'terrance', overrides))
      .toBe('sensor.custom_bat');
  });

  it('resolves alias overrides (CHARGING → CHARGER_SWITCH)', () => {
    // CHARGER_SWITCH is an alias for CHARGING.
    // When user overrides CHARGING, CHARGER_SWITCH template should also resolve.
    const overrides = { CHARGING: 'switch.my_custom_charge' };
    expect(resolveEntityId('switch.{car_name}_charge', 'terrance', overrides))
      .toBe('switch.my_custom_charge');
  });

  it('falls through to template replacement when override key not present', () => {
    const overrides = { UNRELATED_KEY: 'sensor.something' };
    expect(resolveEntityId('sensor.{car_name}_battery_level', 'terrance', overrides))
      .toBe('sensor.terrance_battery_level');
  });

  it('lowercases car_name in template replacement', () => {
    expect(resolveEntityId('sensor.{car_name}_speed', 'MyTesla'))
      .toBe('sensor.mytesla_speed');
  });
});

// ── getEntities() ──────────────────────────────────────────────────────────

describe('getEntities', () => {
  it('returns fleet entities by default', () => {
    const e = getEntities();
    expect(e.BATTERY_LEVEL).toBe('sensor.{car_name}_battery_level');
  });

  it('returns fleet entities for "fleet"', () => {
    const e = getEntities('fleet');
    expect(e.BATTERY_LEVEL).toBe('sensor.{car_name}_battery_level');
  });

  it('returns custom entities for "custom"', () => {
    const e = getEntities('custom');
    expect(e.BATTERY_LEVEL).toBe('sensor.{car_name}_battery');
  });

  it('returns fleet entities for "entities" mode', () => {
    const e = getEntities('entities');
    expect(e.BATTERY_LEVEL).toBe('sensor.{car_name}_battery_level');
  });

  it('falls back to fleet for unknown integration', () => {
    const e = getEntities('nonexistent');
    expect(e.BATTERY_LEVEL).toBe('sensor.{car_name}_battery_level');
  });

  it('fleet and custom have different entity patterns for same keys', () => {
    const fleet = getEntities('fleet');
    const custom = getEntities('custom');
    // Climate differs between integrations
    expect(fleet.CLIMATE).toBe('climate.{car_name}_climate');
    expect(custom.CLIMATE).toBe('climate.{car_name}_hvac_climate_system');
  });

  it('fleet has individual door sensors, custom has combined', () => {
    const fleet = getEntities('fleet');
    const custom = getEntities('custom');
    expect(fleet.DOOR_DRIVER_FRONT).toBeTruthy();
    expect(custom.DOOR_DRIVER_FRONT).toBeNull();
    expect(custom.DOORS).toBeTruthy();
    expect(fleet.DOORS).toBeNull();
  });
});

// ── ENTITY_GROUPS ──────────────────────────────────────────────────────────

describe('ENTITY_GROUPS', () => {
  it('is an array of groups with label and keys', () => {
    expect(Array.isArray(ENTITY_GROUPS)).toBe(true);
    for (const group of ENTITY_GROUPS) {
      expect(group).toHaveProperty('label');
      expect(group).toHaveProperty('keys');
      expect(Array.isArray(group.keys)).toBe(true);
    }
  });

  it('every key entry has key, label, and domain', () => {
    for (const group of ENTITY_GROUPS) {
      for (const entry of group.keys) {
        expect(entry).toHaveProperty('key');
        expect(entry).toHaveProperty('label');
        expect(entry).toHaveProperty('domain');
      }
    }
  });

  it('contains expected groups', () => {
    const labels = ENTITY_GROUPS.map(g => g.label);
    expect(labels).toContain('Sensors');
    expect(labels).toContain('Climate');
    expect(labels).toContain('Charging');
    expect(labels).toContain('Lock');
    expect(labels).toContain('Tire Pressure');
  });
});

// ── US entity names only ────────────────────────────────────────────────────

describe('Fleet US entity names', () => {
  const fleet = getEntities('fleet');

  it('uses frunk/trunk/windows covers', () => {
    expect(fleet.OPEN_FRUNK).toBe('cover.{car_name}_frunk');
    expect(fleet.OPEN_TRUNK).toBe('cover.{car_name}_trunk');
    expect(fleet.WINDOWS_COVER).toBe('cover.{car_name}_windows');
  });

  it('uses TIRE_ keys and tire_pressure sensors', () => {
    expect(Object.keys(fleet).filter(k => /^TIRE_(FL|FR|RL|RR)$/.test(k))).toHaveLength(4);
    expect(fleet.TIRE_FL).toBe('sensor.{car_name}_tire_pressure_front_left');
  });

  it('every cover default is a US name', () => {
    const covers = Object.values(fleet).filter(v => v && v.startsWith('cover.'));
    const us = ['charge_port_door', 'frunk', 'trunk', 'windows'].map(n => `cover.{car_name}_${n}`);
    expect(covers.every(c => us.includes(c))).toBe(true);
  });
});
