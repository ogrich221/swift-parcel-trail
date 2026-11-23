export const languages = [
 {code:'en',name:'English'}, {code:'es',name:'Español'}, {code:'fr',name:'Français'},
 {code:'de',name:'Deutsch'}, {code:'it',name:'Italiano'}, {code:'pt',name:'Português'},
 {code:'nl',name:'Nederlands'}, {code:'ru',name:'Русский'}, {code:'zh',name:'中文'},
 {code:'ja',name:'日本語'}, {code:'ko',name:'한국어'}, {code:'hi',name:'हिन्दी'},
 {code:'tr',name:'Türkçe'}, {code:'pl',name:'Polski'}, {code:'sv',name:'Svenska'},
] as const;
export type LanguageCode = typeof languages[number]['code'];
export function isLanguageCode(value:string):value is LanguageCode{return languages.some(l=>l.code===value)}