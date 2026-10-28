export interface GanjoorPoetRef {
  Id: number;
  Nickname: string;
  FullUrl: string;
}

export interface GanjoorManifest {
  SchemaVersion: number;
  GeneratedAtUtc: string;
  PoetsCount: number;
  PoemsCount: number;
  PeopleCount: number;
  LocationsCount: number;
  GeoTagsCount: number;
  PersonTagsCount: number;
  LiteraryDevicesCount: number;
  LiteraryConceptsCount: number;
  LiteraryTagsCount: number;
  PersonIndexShardSize: number;
  IdIndexShardSize: number;
  UrlTemplates: Record<string, string>;
  Poets: GanjoorPoetRef[];
}

export interface GanjoorPoet {
  Id: number;
  Name: string;
  Nickname: string;
  Description?: string;
  FullUrl: string;
  BirthYearInLHijri?: number;
  DeathYearInLHijri?: number;
  BirthPlaceId?: number;
  DeathPlaceId?: number;
}

export interface GanjoorCategoryRef {
  Id: number;
  Title: string;
  FullUrl: string;
}

export interface GanjoorCategory {
  Id: number;
  PoetId: number;
  Title: string;
  FullUrl: string;
  Description?: string;
  ChildCats?: GanjoorCategoryRef[];
  Poems?: GanjoorCategoryRef[];
}

export interface GanjoorVerse {
  VOrder: number;
  Position: 'Right' | 'Left' | 'Single' | string;
  Text: string;
  CoupletIndex: number;
  SectionIndex1?: number;
  CoupletSummary?: string;
}

export interface GanjoorLiteraryTagPart {
  SlotId: number;
  CoupletIndex: number;
  Misra: number; // 0: couplet, 1: right misra, 2: left misra
  WordStart?: number;
  WordEnd?: number;
  ConceptId?: number;
  Text?: string;
}

export interface GanjoorLiteraryTag {
  CoupletIndex: number;
  DeviceId: number;
  Uncertain: boolean;
  Origin: string; // e.g. AcademicCorpus
  SourceKey?: string;
  MachineGenerated: boolean;
  Parts: GanjoorLiteraryTagPart[];
}

export interface GanjoorPoem {
  Id: number;
  CatId: number;
  PoetId?: number;
  PoetSlug?: string;
  Title: string;
  FullTitle: string;
  FullUrl: string;
  RhymeLetters?: string;
  SourceName?: string;
  SourceUrlSlug?: string;
  PoemSummary?: string;
  Metre?: string | { Id?: number; Rhythm?: string };
  Rhythm?: string;
  Verses: GanjoorVerse[];
  Tags?: any[];
  LiteraryTags?: GanjoorLiteraryTag[];
}

export interface GanjoorLiteraryDeviceSlot {
  Id: number;
  Key: string;
  Name: string;
  Kind: string;
  Required: boolean;
  AllowMultiple: boolean;
  Order: number;
}

export interface GanjoorLiteraryDevice {
  Id: number;
  Key: string;
  Name: string;
  Category: string;
  Definition: string;
  Example: string;
  IsCore: boolean;
  Slots: GanjoorLiteraryDeviceSlot[];
}

export interface GanjoorLiterarySource {
  Key: string;
  Name: string;
  Title: string;
  Authors: string;
  Url: string;
  Description: string;
  License: string;
  LicenseText: string;
}

export interface GanjoorLocation {
  Id: number;
  Name: string;
  Latitude: number;
  Longitude: number;
  MachineGenerated?: boolean;
}

export interface GanjoorPerson {
  Id: number;
  Name: string;
  Gender: string;
  Importance?: string;
  BirthYearInLHijri?: number;
  ValidBirthDate?: boolean;
  DeathYearInLHijri?: number;
  ValidDeathDate?: boolean;
  FamilyTreeCaption?: string;
  BirthPlaceId?: number;
  DeathPlaceId?: number;
  Description?: string;
  MachineGenerated?: boolean;
}

export interface GanjoorRelationEvidence {
  PoemId: number;
  CoupletIndex: number;
  MasterCatId: number;
}

export interface GanjoorPersonRelation {
  Id: number;
  Person1Id: number;
  Person2Id: number;
  RelationType: 'Parent' | 'Sibling' | 'Spouse' | 'Ancestor' | string;
  Evidence: GanjoorRelationEvidence[];
}

export interface GanjoorPersonAffiliation {
  Id: number;
  Person1Id: number;
  Person2Id: number;
  AffiliationType: string;
  Note?: string;
  Evidence?: GanjoorRelationEvidence[];
}

export interface GanjoorMetre {
  Id: number;
  Rhythm: string;
  Name?: string;
}

export interface GanjoorGeotag {
  LocationId: number;
  PoemId: number;
  CoupletIndex: number;
  PoetId?: number;
}

export interface GanjoorLanguage {
  Id: number;
  Name: string;
  NativeName?: string;
  Code?: string;
  Description?: string;
}

export interface GanjoorLiteraryConcept {
  Id: number;
  Name: string;
  Definition?: string;
  Category?: string;
}
