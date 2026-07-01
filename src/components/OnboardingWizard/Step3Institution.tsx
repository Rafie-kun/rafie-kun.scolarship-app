import React from 'react';
import { WORLD_COUNTRIES } from '../../utils/curriculumData';
import { School, MapPin, Calendar, Award } from 'lucide-react';

interface Step3InstitutionProps {
  institutionName: string;
  onInstitutionNameChange: (name: string) => void;
  country: string;
  onCountryChange: (country: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  graduationYear: number;
  onGraduationYearChange: (year: number) => void;
  targetCountry: string;
  onTargetCountryChange: (country: string) => void;
}

export default function Step3Institution({
  institutionName,
  onInstitutionNameChange,
  country,
  onCountryChange,
  city,
  onCityChange,
  graduationYear,
  onGraduationYearChange,
  targetCountry,
  onTargetCountryChange
}: Step3InstitutionProps) {
  return (
    <div className="space-y-4" id="wizard-step3">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <School className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          3. Institution Coordinates
        </h4>
      </div>
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Enter details about your active or most recent educational institution, and where you hope to study.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            School / University Name:
          </span>
          <div className="relative">
            <input
              type="text"
              value={institutionName}
              onChange={(e) => onInstitutionNameChange(e.target.value)}
              placeholder="e.g., Maplewood Collegiate or Imperial Tech"
              className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55] text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            Institution Country:
          </span>
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 text-xs outline-none w-full font-mono"
          >
            {WORLD_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Other">Other / Not Listed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            City:
          </span>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="e.g., Boston"
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55] text-xs font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            Target Destination Country:
          </span>
          <select
            value={targetCountry}
            onChange={(e) => onTargetCountryChange(e.target.value)}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 text-xs outline-none w-full font-mono"
          >
            {WORLD_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            Expected Graduation Year:
          </span>
          <input
            type="number"
            value={graduationYear}
            min={2020}
            max={2035}
            onChange={(e) => onGraduationYearChange(Number(e.target.value))}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55] text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
}
