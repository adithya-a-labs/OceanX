/**
 * OceanX Cesium Argo Marker Renderer
 * Renders Argo float buoys as interactive 3D markers on the Cesium globe.
 * Connects click and hover interactions to the existing OceanX Argo state and panels.
 */

import * as Cesium from 'cesium';
import type { ArgoProfile, ArgoMarker } from '../types';
import type { GlobeEvents } from '../components/globe/types';

function createMarkerSvg(selected: boolean, hovered: boolean): string {
  const size = selected ? 44 : hovered ? 38 : 32;
  const radius = size / 2;
  const innerRadius = selected ? 8 : 6;
  const ringRadius = radius - 3;

  const strokeColor = selected ? '#f97316' : hovered ? '#38bdf8' : '#0ea5e9';
  const fillColor = selected ? '#ea580c' : hovered ? '#0284c7' : '#0ea5e9';
  const ringFill = selected ? 'rgba(249, 115, 22, 0.3)' : 'rgba(14, 165, 233, 0.25)';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${radius}" cy="${radius}" r="${ringRadius}" fill="${ringFill}" stroke="${strokeColor}" stroke-width="2"/>
    <circle cx="${radius}" cy="${radius}" r="${innerRadius}" fill="${fillColor}"/>
    <circle cx="${radius}" cy="${radius}" r="3" fill="#ffffff"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const DEFAULT_MARKER_URI = createMarkerSvg(false, false);
const HOVER_MARKER_URI = createMarkerSvg(false, true);
const SELECTED_MARKER_URI = createMarkerSvg(true, false);

export class ArgoMarkerRenderer {
  private viewer: Cesium.Viewer;
  private events: GlobeEvents;
  private container: HTMLDivElement;
  private floatEntities: Map<string, Cesium.Entity> = new Map();
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private isVisible = true;
  private isDisposed = false;

  constructor(viewer: Cesium.Viewer, events: GlobeEvents, container: HTMLDivElement) {
    this.viewer = viewer;
    this.events = events;
    this.container = container;

    this.setupInteractions();
  }

  public setProfiles(profiles: ArgoProfile[]): void {
    if (this.isDisposed) return;

    // Clear old entities
    this.clear();

    for (const profile of profiles) {
      const isSelected = profile.id === this.selectedId;

      const entity = this.viewer.entities.add({
        id: `argo-${profile.id}`,
        name: profile.id,
        position: Cesium.Cartesian3.fromDegrees(profile.longitude, profile.latitude, 3500),
        billboard: {
          image: isSelected ? SELECTED_MARKER_URI : DEFAULT_MARKER_URI,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scale: 1.0,
        },
        label: {
          text: profile.id,
          font: "11px 'JetBrains Mono', monospace",
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#082f49'),
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, isSelected ? 24 : 18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000000),
        },
        properties: new Cesium.PropertyBag({
          isArgoFloat: true,
          argoId: profile.id,
          profileData: profile,
        }),
        show: this.isVisible,
      });

      this.floatEntities.set(profile.id, entity);
    }
  }

  private setupInteractions(): void {
    const scene = this.viewer.scene;
    this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // Click handler for Argo marker selection
    this.handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      if (!this.isVisible) return;

      const picked = scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && picked.id.properties?.isArgoFloat?.getValue()) {
        const argoId = picked.id.properties.argoId.getValue() as string;
        const profile = picked.id.properties.profileData.getValue() as ArgoProfile;

        this.setSelectedId(argoId);

        const marker: ArgoMarker = {
          id: argoId,
          latitude: profile.latitude,
          longitude: profile.longitude,
        };

        // Notify UI bridge
        this.events.onArgoMarkerClick(marker);
        this.events.setSelectedArgoId(argoId);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Mouse move handler for hover cursor and styling
    this.handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      if (!this.isVisible) return;

      const picked = scene.pick(movement.endPosition);
      if (Cesium.defined(picked) && picked.id && picked.id.properties?.isArgoFloat?.getValue()) {
        const argoId = picked.id.properties.argoId.getValue() as string;
        this.container.style.cursor = 'pointer';

        if (this.hoveredId !== argoId && argoId !== this.selectedId) {
          this.setHoveredId(argoId);
        }
      } else {
        this.container.style.cursor = 'default';
        if (this.hoveredId) {
          this.setHoveredId(null);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  public setSelectedId(id: string | null): void {
    this.selectedId = id;
    for (const [floatId, entity] of this.floatEntities) {
      const isSelected = floatId === id;
      if (entity.billboard) {
        entity.billboard.image = new Cesium.ConstantProperty(
          isSelected ? SELECTED_MARKER_URI : DEFAULT_MARKER_URI
        );
        entity.billboard.scale = new Cesium.ConstantProperty(isSelected ? 1.15 : 1.0);
      }
      if (entity.label) {
        entity.label.pixelOffset = new Cesium.ConstantProperty(
          new Cesium.Cartesian2(0, isSelected ? 24 : 18)
        );
      }
    }
  }

  private setHoveredId(id: string | null): void {
    this.hoveredId = id;
    for (const [floatId, entity] of this.floatEntities) {
      if (floatId === this.selectedId) continue;
      const isHovered = floatId === id;
      if (entity.billboard) {
        entity.billboard.image = new Cesium.ConstantProperty(
          isHovered ? HOVER_MARKER_URI : DEFAULT_MARKER_URI
        );
        entity.billboard.scale = new Cesium.ConstantProperty(isHovered ? 1.1 : 1.0);
      }
    }
  }

  public setShow(show: boolean): void {
    this.isVisible = show;
    for (const entity of this.floatEntities.values()) {
      entity.show = show;
    }
  }

  public clear(): void {
    for (const entity of this.floatEntities.values()) {
      this.viewer.entities.remove(entity);
    }
    this.floatEntities.clear();
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    this.clear();
  }
}
