import MapboxLanguage from '@mapbox/mapbox-gl-language';
import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import Map, {
  Layer,
  Source,
  FullscreenControl,
  NavigationControl,
  MapRef,
  MapInstance,
} from 'react-map-gl/mapbox';
import {
  IS_CHINESE,
  ROAD_LABEL_DISPLAY,
  MAPBOX_TOKEN,
  USE_DASH_LINE,
  LINE_OPACITY,
  MAP_HEIGHT,
  MAP_TILE_VENDOR,
  MAP_TILE_ACCESS_TOKEN,
  getRuntimeSingleColor,
} from '@/utils/const';
import {
  Coordinate,
  IViewState,
  getMapStyle,
  isTouchDevice,
} from '@/utils/geoUtils';
import { RouteAnimator } from '@/utils/routeAnimation';
import RunMarker from './RunMarker';
import RunMapButtons from './RunMapButtons';
import styles from './style.module.css';
import type { FeatureCollection } from 'geojson';
import type { RPGeometry } from '@/static/run_countries';
import './mapbox.css';
import { useMapTheme, useThemeChangeCounter } from '@/hooks/useTheme';

const KEEP_WHEN_LIGHTS_OFF = ['runs2', 'runs2-indoor', 'animated-run'];

interface IRunMapProps {
  title: string;
  viewState: IViewState;
  setViewState: (_viewState: IViewState) => void;
  changeYear: (_year: string) => void;
  geoData: FeatureCollection<RPGeometry>;
  thisYear: string;
  animationTrigger?: number; // Optional trigger to force animation replay
}

type MapStyleLayer = {
  id: string;
  type?: string;
  layout?: Record<string, unknown>;
};

const RunMap = ({
  title,
  viewState,
  setViewState,
  changeYear,
  geoData,
  thisYear,
  animationTrigger,
}: IRunMapProps) => {
  const mapRef = useRef<MapRef>(null);
  const lights = true;
  const [mapError, setMapError] = useState<string | null>(null);

  // Use the map theme hook to get the current map theme
  const currentMapTheme = useMapTheme();
  // Listen for theme changes to update single run color
  useThemeChangeCounter();

  // Get theme-aware single run color that updates when theme changes
  const singleRunColor = getRuntimeSingleColor();

  // Generate map style based on current theme
  const mapStyle = useMemo(
    () => getMapStyle(MAP_TILE_VENDOR, currentMapTheme, MAP_TILE_ACCESS_TOKEN),
    [currentMapTheme]
  );

  const mapboxAccessToken = MAPBOX_TOKEN;

  const switchLayerVisibility = useCallback(
    (map: MapInstance, nextLights: boolean) => {
      const styleJson = map.getStyle();
      (styleJson.layers ?? []).forEach((layer: { id: string }) => {
        if (KEEP_WHEN_LIGHTS_OFF.includes(layer.id)) return;
        try {
          map.setLayoutProperty(
            layer.id,
            'visibility',
            nextLights ? 'visible' : 'none'
          );
        } catch {
          // Some third-party styles expose transient layers during load.
        }
      });
    },
    []
  );

  const applyMapLayerTweaks = useCallback(
    (map: MapInstance) => {
      try {
        if (!ROAD_LABEL_DISPLAY) {
          const layers = (map.getStyle().layers ?? []) as MapStyleLayer[];
          const labelLayerNames = layers
            .filter(
              (layer) =>
                (layer.type === 'symbol' || layer.type === 'composite') &&
                (layer.layout?.['text-field'] !== undefined ||
                  layer.layout?.text_field !== undefined)
            )
            .map((layer) => layer.id);
          labelLayerNames.forEach((layerId) => {
            try {
              map.removeLayer(layerId);
            } catch {
              // The layer may have already been removed by a prior style event.
            }
          });
        }
        switchLayerVisibility(map, lights);
      } catch (error) {
        console.warn('Error applying map layer tweaks:', error);
      }
    },
    [lights, switchLayerVisibility]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const styleLoadHandler = () => applyMapLayerTweaks(map);
    const dataHandler = (event: { dataType?: string }) => {
      if (event.dataType === 'style') applyMapLayerTweaks(map);
    };
    map.on('style.load', styleLoadHandler);
    map.on('data', dataHandler);
    styleLoadHandler();
    return () => {
      map.off('style.load', styleLoadHandler);
      map.off('data', dataHandler);
    };
  }, [applyMapLayerTweaks, mapStyle]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();

      // Track tile loading errors
      let tileErrorCount = 0;
      const MAX_TILE_ERRORS = 10;

      const handleStyleError = (e: unknown) => {
        console.error('❌ Map style failed to load:', e);
        setMapError(
          'Map tiles failed to load. Please check your internet connection.'
        );

        if (MAP_TILE_VENDOR === 'mapcn') {
          console.warn('⚠️ Carto Basemaps (MapCN) failed to load.');
          console.info('💡 Possible solutions:');
          console.info('   1. Check your internet connection');
          console.info(
            '   2. If in China, Carto may be blocked.  Try fallback:'
          );
          console.info('      - Change MAP_TILE_VENDOR to "mapcn_openfreemap"');
          console.info(
            '      - Or use MAP_TILE_VENDOR = "maptiler" with free token'
          );
        }
      };

      const handleTileError = () => {
        tileErrorCount++;

        if (tileErrorCount === MAX_TILE_ERRORS) {
          console.error(`❌ ${MAX_TILE_ERRORS}+ tile loading errors detected`);
          console.warn('⚠️ Map tiles are not loading properly.');
          console.info(
            '💡 Try switching to a different provider in src/utils/const.ts'
          );
        }
      };

      map.on('error', handleStyleError);
      map.on('tileerror', handleTileError);

      // Cleanup
      return () => {
        map.off('error', handleStyleError);
        map.off('tileerror', handleTileError);
      };
    }
  }, [mapRef]);

  // animation state (single run only)
  const [animatedPoints, setAnimatedPoints] = useState<Coordinate[]>([]);
  const routeAnimatorRef = useRef<RouteAnimator | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  const mapRefCallback = useCallback(
    (ref: MapRef | null) => {
      if (ref === null) return;
      mapRef.current = ref;
      const map = ref.getMap();
      if (map && IS_CHINESE) {
        map.addControl(new MapboxLanguage({ defaultLanguage: 'zh-Hans' }));
      }
      applyMapLayerTweaks(map);
    },
    [applyMapLayerTweaks]
  );

  const isBigMap = (viewState.zoom ?? 0) <= 3;

  // Memoize expensive calculations
  const { isSingleRun, startLon, startLat, endLon, endLat, isIndoorRun } =
    useMemo(() => {
      const isSingle =
        geoData.features.length === 1 &&
        geoData.features[0].geometry.coordinates.length;

      let startLon = 0;
      let startLat = 0;
      let endLon = 0;
      let endLat = 0;
      let isIndoor = false;

      if (isSingle) {
        const points = geoData.features[0].geometry.coordinates as Coordinate[];
        [startLon, startLat] = points[0];
        [endLon, endLat] = points[points.length - 1];
        isIndoor = geoData.features[0].properties?.indoor === true;
      }

      return {
        isSingleRun: isSingle,
        startLon,
        startLat,
        endLon,
        endLat,
        isIndoorRun: isIndoor,
      };
    }, [geoData]);

  const dash = useMemo(() => {
    return USE_DASH_LINE && !isSingleRun && !isBigMap ? [2, 2] : [2, 0];
  }, [isSingleRun, isBigMap]);

  const onMove = useCallback(
    ({ viewState }: { viewState: IViewState }) => {
      setViewState(viewState);
    },
    [setViewState]
  );

  const style: React.CSSProperties = useMemo(
    () => ({
      width: '100%',
      height: MAP_HEIGHT,
      maxWidth: '100%', // Prevent overflow on mobile
    }),
    []
  );

  const fullscreenButton: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      marginTop: '29.2px',
      right: '0px',
      opacity: 0.3,
    }),
    []
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (mapRef.current) {
        mapRef.current.getMap().resize();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // start route animation using RouteAnimator
  const startRouteAnimation = useCallback(() => {
    if (!isSingleRun) return;
    const points = geoData.features[0].geometry.coordinates as Coordinate[];
    if (!points || points.length < 2) return;

    // Stop any existing animation
    if (routeAnimatorRef.current) {
      routeAnimatorRef.current.stop();
    }

    // Create new animator
    routeAnimatorRef.current = new RouteAnimator(
      points,
      setAnimatedPoints,
      () => {
        routeAnimatorRef.current = null;
      }
    );

    // Start animation
    routeAnimatorRef.current.start();
  }, [geoData, isSingleRun]);

  // autoplay once when single run changes
  useEffect(() => {
    if (!isSingleRun) return;
    const pts = geoData.features[0].geometry.coordinates as Coordinate[];
    const key = `${pts.length}-${pts[0]?.join(',')}-${pts[pts.length - 1]?.join(',')}`;
    if (key && key !== lastRouteKeyRef.current) {
      lastRouteKeyRef.current = key;
      startRouteAnimation();
    }
    // cleanup on unmount
    return () => {
      if (routeAnimatorRef.current) {
        routeAnimatorRef.current.stop();
      }
    };
  }, [geoData, isSingleRun, startRouteAnimation]);

  // Force animation when animationTrigger changes (for table clicks)
  useEffect(() => {
    if (animationTrigger && animationTrigger > 0 && isSingleRun) {
      startRouteAnimation();
    }
  }, [animationTrigger, isSingleRun, startRouteAnimation]);

  const handleMapClick = useCallback(() => {
    if (!isSingleRun) return;
    startRouteAnimation();
  }, [isSingleRun, startRouteAnimation]);

  return (
    <Map
      {...viewState}
      onMove={onMove}
      onClick={handleMapClick}
      style={style}
      mapStyle={mapStyle}
      ref={mapRefCallback}
      cooperativeGestures={isTouchDevice()}
      mapboxAccessToken={mapboxAccessToken}
    >
      {mapError && (
        <div className={styles.mapErrorNotification}>
          <span>⚠️ {mapError}</span>
          <button onClick={() => window.location.reload()}>Reload Page</button>
          <a
            href="https://github.com/yihong0618/running_page#map-tiles-customization"
            target="_blank"
            rel="noopener noreferrer"
          >
            Troubleshooting Guide
          </a>
        </div>
      )}
      <RunMapButtons changeYear={changeYear} thisYear={thisYear} />
      <Source id="data" type="geojson" data={geoData}>
        <Layer
          id="runs2"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': isBigMap && lights ? 1.5 : 2.5,
            'line-dasharray': dash,
            'line-opacity':
              isSingleRun || isBigMap || !lights ? 1 : LINE_OPACITY,
            'line-blur': 1,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          filter={['!=', ['get', 'indoor'], true]}
        />
        <Layer
          id="runs2-indoor"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': isBigMap && lights ? 1.5 : 2.5,
            'line-dasharray': [4, 3],
            'line-opacity':
              isSingleRun || isBigMap || !lights ? 0.6 : LINE_OPACITY * 0.6,
            'line-blur': 1,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          filter={['==', ['get', 'indoor'], true]}
        />
      </Source>
      {isSingleRun && animatedPoints.length > 0 && (
        <Source
          id="animated-run"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { color: singleRunColor },
                geometry: {
                  type: 'LineString',
                  coordinates: animatedPoints,
                },
              },
            ],
          }}
        >
          <Layer
            id="animated-run"
            type="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-width': isIndoorRun ? 2 : 3,
              'line-opacity': 1,
              'line-dasharray': isIndoorRun ? [4, 3] : [2, 0],
            }}
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
          />
        </Source>
      )}
      {isSingleRun && (
        <RunMarker
          startLat={startLat}
          startLon={startLon}
          endLat={endLat}
          endLon={endLon}
        />
      )}
      <span className={styles.runTitle}>{title}</span>
      <FullscreenControl style={fullscreenButton} />
      <NavigationControl
        showCompass={false}
        position={'bottom-right'}
        style={{ opacity: 0.3 }}
      />
    </Map>
  );
};

export default RunMap;
