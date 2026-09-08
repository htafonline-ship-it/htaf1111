import React, { useState, useEffect, useRef } from 'react';
import {
  SAUDI_REGIONS,
  SaudiRegion,
  SaudiGovernorate,
  SaudiCity,
  getGovernoratesByRegionId,
  getCitiesByGovernorateId,
  findGeoByCoordinates
} from '../data/saudiGeoData';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  Crosshair,
  Building,
  Check,
  Globe
} from 'lucide-react';

export interface SchoolLocationData {
  regionId: string;
  regionName: string;
  governorateId: string;
  governorateName: string;
  cityId: string;
  cityName: string;
  district: string;
  shortNationalAddress: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  educationDirectorate: string;
}

interface SchoolLocationPickerProps {
  initialData?: Partial<SchoolLocationData>;
  onChange: (location: SchoolLocationData) => void;
  existingSchools?: any[];
  currentSchoolName?: string;
  currentMoeCode?: string;
}

export const SchoolLocationPicker: React.FC<SchoolLocationPickerProps> = ({
  initialData,
  onChange,
  existingSchools = [],
  currentSchoolName = '',
  currentMoeCode = ''
}) => {
  // Default to Riyadh / Al-Kharj as a central baseline
  const [selectedRegionId, setSelectedRegionId] = useState<string>(initialData?.regionId || 'reg-riyadh');
  const [selectedGovId, setSelectedGovId] = useState<string>(initialData?.governorateId || 'gov-kharj');
  const [selectedCityId, setSelectedCityId] = useState<string>(initialData?.cityId || 'city-saihat-kharj');
  const [district, setDistrict] = useState<string>(initialData?.district || 'حي الخزامى');
  const [shortAddress, setShortAddress] = useState<string>(initialData?.shortNationalAddress || 'KHRA4291');
  const [postalCode, setPostalCode] = useState<string>(initialData?.postalCode || '11942');
  const [lat, setLat] = useState<number>(initialData?.latitude || 24.1556);
  const [lng, setLng] = useState<number>(initialData?.longitude || 47.3119);
  const [directorate, setDirectorate] = useState<string>(initialData?.educationDirectorate || 'إدارة التعليم بمحافظة الخرج');

  // Interactive UI State
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccessMsg, setGeoSuccessMsg] = useState<string | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(true);

  // Lists from central hierarchy
  const availableGovernorates = getGovernoratesByRegionId(selectedRegionId);
  const availableCities = getCitiesByGovernorateId(selectedGovId);
  const selectedCityObj = availableCities.find(c => c.id === selectedCityId || c.name === selectedCityId);

  // Sync to parent
  const notifyChange = (updated: Partial<SchoolLocationData> = {}) => {
    const regObj = SAUDI_REGIONS.find(r => r.id === (updated.regionId || selectedRegionId));
    const govObj = availableGovernorates.find(g => g.id === (updated.governorateId || selectedGovId));
    const cityObj = availableCities.find(c => c.id === (updated.cityId || selectedCityId));

    const finalData: SchoolLocationData = {
      regionId: updated.regionId || selectedRegionId,
      regionName: updated.regionName || regObj?.name || 'منطقة الرياض',
      governorateId: updated.governorateId || selectedGovId,
      governorateName: updated.governorateName || govObj?.name || 'محافظة الخرج',
      cityId: updated.cityId || selectedCityId,
      cityName: updated.cityName || cityObj?.name || 'مدينة السيح',
      district: updated.district !== undefined ? updated.district : district,
      shortNationalAddress: updated.shortNationalAddress !== undefined ? updated.shortNationalAddress : shortAddress,
      postalCode: updated.postalCode !== undefined ? updated.postalCode : postalCode,
      latitude: updated.latitude !== undefined ? updated.latitude : lat,
      longitude: updated.longitude !== undefined ? updated.longitude : lng,
      educationDirectorate: updated.educationDirectorate || govObj?.directorate || regObj?.directorate || directorate
    };

    onChange(finalData);
  };

  // Region change handler
  const handleRegionChange = (newRegId: string) => {
    setSelectedRegionId(newRegId);
    const govs = getGovernoratesByRegionId(newRegId);
    if (govs.length > 0) {
      const firstGov = govs[0];
      setSelectedGovId(firstGov.id);
      const cities = firstGov.cities;
      if (cities.length > 0) {
        const firstCity = cities[0];
        setSelectedCityId(firstCity.id);
        setLat(firstCity.lat);
        setLng(firstCity.lng);
        setPostalCode(firstCity.postalCodePrefix || '');
        setDistrict(firstCity.districts[0] || 'وسط المدينة');
        setDirectorate(firstGov.directorate);
        notifyChange({
          regionId: newRegId,
          governorateId: firstGov.id,
          cityId: firstCity.id,
          cityName: firstCity.name,
          latitude: firstCity.lat,
          longitude: firstCity.lng,
          postalCode: firstCity.postalCodePrefix || '',
          district: firstCity.districts[0] || 'وسط المدينة',
          educationDirectorate: firstGov.directorate
        });
      }
    }
  };

  // Governorate change handler
  const handleGovChange = (newGovId: string) => {
    setSelectedGovId(newGovId);
    const cities = getCitiesByGovernorateId(newGovId);
    const govObj = availableGovernorates.find(g => g.id === newGovId);
    if (cities.length > 0) {
      const firstCity = cities[0];
      setSelectedCityId(firstCity.id);
      setLat(firstCity.lat);
      setLng(firstCity.lng);
      setPostalCode(firstCity.postalCodePrefix || '');
      setDistrict(firstCity.districts[0] || 'وسط المدينة');
      if (govObj?.directorate) setDirectorate(govObj.directorate);
      notifyChange({
        governorateId: newGovId,
        cityId: firstCity.id,
        cityName: firstCity.name,
        latitude: firstCity.lat,
        longitude: firstCity.lng,
        postalCode: firstCity.postalCodePrefix || '',
        district: firstCity.districts[0] || 'وسط المدينة',
        educationDirectorate: govObj?.directorate
      });
    }
  };

  // City change handler
  const handleCityChange = (newCityId: string) => {
    setSelectedCityId(newCityId);
    const cityObj = availableCities.find(c => c.id === newCityId);
    if (cityObj) {
      setLat(cityObj.lat);
      setLng(cityObj.lng);
      if (cityObj.postalCodePrefix) setPostalCode(cityObj.postalCodePrefix);
      if (cityObj.districts.length > 0) setDistrict(cityObj.districts[0]);
      notifyChange({
        cityId: newCityId,
        cityName: cityObj.name,
        latitude: cityObj.lat,
        longitude: cityObj.lng,
        postalCode: cityObj.postalCodePrefix || postalCode,
        district: cityObj.districts[0] || district
      });
    }
  };

  // 1. Automatic Geolocation with Browser API & Reverse Geocoding
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);
    setGeoSuccessMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        setLat(userLat);
        setLng(userLng);

        try {
          // Attempt reverse geocoding from OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&accept-language=ar`,
            { headers: { 'User-Agent': 'HatafSciencePlatform/1.0' } }
          );

          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const detectedDistrict = addr.suburb || addr.neighbourhood || addr.quarter || district;
            const detectedPostal = addr.postcode || postalCode;

            // Generate synthetic short national address
            const cleanShort = `SA-${Math.round(userLat * 100).toString().slice(-2)}${Math.round(userLng * 100).toString().slice(-2)}`;
            setShortAddress(cleanShort);
            if (detectedDistrict) setDistrict(detectedDistrict);
            if (detectedPostal) setPostalCode(detectedPostal);
          }
        } catch (e) {
          console.warn('Reverse geocode fallback:', e);
        }

        // Match with nearest Saudi administrative center
        const matched = findGeoByCoordinates(userLat, userLng);
        if (matched.region) {
          setSelectedRegionId(matched.region.id);
          if (matched.governorate) {
            setSelectedGovId(matched.governorate.id);
            setDirectorate(matched.governorate.directorate);
          }
          if (matched.city) {
            setSelectedCityId(matched.city.id);
          }
        }

        setIsLocating(false);
        setIsLocationConfirmed(true);
        setGeoSuccessMsg('تم التقاط إحداثيات موقع المدرسة بنجاح! يُرجى مراجعة الموقع على الخريطة وتأكيده.');
        notifyChange({
          latitude: userLat,
          longitude: userLng,
          regionId: matched.region?.id,
          governorateId: matched.governorate?.id,
          cityId: matched.city?.id
        });
      },
      (err) => {
        setIsLocating(false);
        let msg = 'تعذر الوصول إلى الموقع الجغرافي تلقائياً.';
        if (err.code === 1) msg = 'تم رفض إذن الوصول للموقع الجغرافي. يُرجى اختيار الموقع من الخريطة أو إدخاله يدوياً.';
        else if (err.code === 2) msg = 'إشارة الموقع الجغرافي غير متوفرة حالياً.';
        else if (err.code === 3) msg = 'انتهت مهلة طلب الموقع الجغرافي.';
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // 2. Search location on map
  const handleSearchOnMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setIsSearchingMap(true);
    try {
      const queryWithSaudi = `${mapSearchQuery.trim()}, Saudi Arabia`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithSaudi)}&accept-language=ar&limit=5`,
        { headers: { 'User-Agent': 'HatafSciencePlatform/1.0' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          setMapSearchResults(
            results.map((r: any) => ({
              name: r.display_name,
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon)
            }))
          );
        } else {
          setGeoError('لم يتم العثور على نتائج للبحث المحدد. جرّب كتابة اسم الحي أو المدينة.');
        }
      }
    } catch (err) {
      console.warn('Map search error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleSelectSearchResult = (res: { name: string; lat: number; lng: number }) => {
    setLat(res.lat);
    setLng(res.lng);
    setMapSearchResults([]);
    setMapSearchQuery('');
    const matched = findGeoByCoordinates(res.lat, res.lng);
    if (matched.region) setSelectedRegionId(matched.region.id);
    if (matched.governorate) {
      setSelectedGovId(matched.governorate.id);
      setDirectorate(matched.governorate.directorate);
    }
    if (matched.city) setSelectedCityId(matched.city.id);

    setIsLocationConfirmed(true);
    notifyChange({
      latitude: res.lat,
      longitude: res.lng,
      regionId: matched.region?.id,
      governorateId: matched.governorate?.id,
      cityId: matched.city?.id
    });
  };

  // Map click / pin adjustment simulator
  const handleMapPinAdjust = (deltaLat: number, deltaLng: number) => {
    const newLat = Number((lat + deltaLat).toFixed(6));
    const newLng = Number((lng + deltaLng).toFixed(6));
    setLat(newLat);
    setLng(newLng);
    setIsLocationConfirmed(true);
    notifyChange({ latitude: newLat, longitude: newLng });
  };

  return (
    <div className="space-y-6">
      {/* Geolocation Top Actions */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 rounded-3xl border border-emerald-800/40 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>الربط الجغرافي المعتمد للمدارس</span>
              </span>
            </div>
            <h4 className="font-black text-sm sm:text-base text-white">
              بيانات وتحديد موقع المدرسة بالمملكة
            </h4>
            <p className="text-xs text-emerald-200/70 max-w-xl leading-relaxed">
              يتم حفظ إحداثيات موقع المدرسة (Latitude / Longitude) والعنوان الوطني للمساهمة في توجيه الخدمات الميدانية والتكامل السحابي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoLocate}
              disabled={isLocating}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              {isLocating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جارٍ جلب الموقع عبر GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-slate-950" />
                  <span>تحديد موقع المدرسة تلقائياً</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowInteractiveMap(!showInteractiveMap)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>{showInteractiveMap ? 'إخفاء الخريطة' : 'تحديد على الخريطة'}</span>
            </button>
          </div>
        </div>

        {geoSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{geoSuccessMsg}</span>
          </div>
        )}

        {geoError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}
      </div>

      {/* Cascading Administrative Dropdowns */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
        <h5 className="font-black text-xs text-slate-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          <span>التسلسل الإداري المترابط: المنطقة ← المحافظة ← المدينة/المركز ← الحي</span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Region */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700">
              المنطقة الإدارية <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SAUDI_REGIONS.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Governorate */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700">
              المحافظة <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedGovId}
              onChange={(e) => handleGovChange(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableGovernorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. City / Center */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700">
              المدينة / المركز <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. District */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700">
              الحي <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="district-options"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  notifyChange({ district: e.target.value });
                }}
                placeholder="اكتب أو اختر اسم الحي..."
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="district-options">
                {selectedCityObj?.districts.map((d, i) => (
                  <option key={i} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Education Directorate & National Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-200 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700">
              إدارة التعليم التابعة لها
            </label>
            <input
              type="text"
              value={directorate}
              onChange={(e) => {
                setDirectorate(e.target.value);
                notifyChange({ educationDirectorate: e.target.value });
              }}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700">
              العنوان الوطني المختصر (Short Address)
            </label>
            <input
              type="text"
              value={shortAddress}
              onChange={(e) => {
                setShortAddress(e.target.value.toUpperCase());
                notifyChange({ shortNationalAddress: e.target.value.toUpperCase() });
              }}
              placeholder="مثال: RRRA2345"
              className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700">
              الرمز البريدي (Postal Code)
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);
                notifyChange({ postalCode: e.target.value });
              }}
              placeholder="مثال: 11942"
              className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Interactive Map Pin & Confirmation View */}
      {showInteractiveMap && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <div>
                <h5 className="font-black text-xs sm:text-sm text-white">
                  معاينة الخريطة وتثبيت علامة الموقع (Interactive Map Pin)
                </h5>
                <span className="text-[11px] text-slate-400">
                  انقر أو حرك العلامة لتعديل موقع المدرسة بدقة
                </span>
              </div>
            </div>

            {/* Coordinates Readout Pill */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400">
              <span>Lat: {lat.toFixed(5)}</span>
              <span className="text-slate-600">|</span>
              <span>Lng: {lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Map Search Form */}
          <form onSubmit={handleSearchOnMap} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                placeholder="ابحث باسم المدرسة، المعلم القريب، أو الشارع..."
                className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingMap}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition shrink-0"
            >
              {isSearchingMap ? 'جارٍ البحث...' : 'بحث بالخريطة'}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {mapSearchResults.length > 0 && (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-2 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold px-2 block">اختر من نتائج البحث:</span>
              {mapSearchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-right p-2 text-xs hover:bg-slate-800 rounded-xl transition flex items-center justify-between gap-2 text-slate-200"
                >
                  <span className="truncate">{res.name}</span>
                  <span className="text-[10px] text-emerald-400 shrink-0 font-mono">
                    {res.lat.toFixed(3)}, {res.lng.toFixed(3)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Interactive Map Visual Stage */}
          <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
            {/* Embedded OpenStreetMap Preview */}
            <iframe
              title="OpenStreetMap School Location"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.015}%2C${lng + 0.015}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
              className="w-full h-full border-0 pointer-events-auto"
            />

            {/* Overlay Navigation Tools */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl text-xs">
              <button
                type="button"
                onClick={() => handleMapPinAdjust(0.001, 0)}
                title="تحريك لأعلى"
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMapPinAdjust(-0.001, 0)}
                title="تحريك لأسفل"
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => handleMapPinAdjust(0, -0.001)}
                title="تحريك يميناً"
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => handleMapPinAdjust(0, 0.001)}
                title="تحريك يساراً"
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
              >
                ▶
              </button>
            </div>

            {/* Location Confirmed Badge */}
            <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 text-[11px] font-black text-emerald-300 flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {selectedCityObj?.name || 'السيح'} - {district}
              </span>
            </div>

            {/* External Google Maps Link */}
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 left-3 bg-slate-950/90 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition"
            >
              <span>فتح في خرائط Google</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {/* Confirmation Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
            <p className="text-slate-400 text-[11px] text-center sm:text-right">
              🔒 <strong className="text-slate-300">سياسة الخصوصية:</strong> يتم تسجيل موقع المنشأة المدرسية فقط ولا يتم تتبع المستخدمين أو الطلاب شخصياً.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsLocationConfirmed(true);
                setGeoSuccessMsg('تم تأكيد موقع المدرسة واعتماده.');
                notifyChange({ latitude: lat, longitude: lng });
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>تأكيد واعتماد إحداثيات الموقع</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
