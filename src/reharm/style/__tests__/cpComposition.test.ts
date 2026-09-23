import {expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {buildPhraseSection,type PhraseSectionOptions} from '../phraseSection'
import {cpCompositionEvidence,cpSoloCells,cpBossaConnections,cpBossaRhythmGestures,cpHandCells,cpRunShapes,cpMelodicContexts} from '../cpComposition'
import type {PhraseSection} from '../phraseSection'
import {CA_PHAO_BOSSA_IMPROVED as bossa} from '../styleLibrary/caPhaoBossa'
import {getStyle} from '../styleLibrary'
import {parseChordInput} from '../../input/chordInputParser'
import {scaleTones} from '../../reharmEngine/keyDetection'
import type {PitchClass} from '../../../shared/musicTheory/types'
import sources from '../caPhaoFullSolos.json'

const base: PhraseSectionOptions = {kind:'interlude',key:{tonic:9,scale:'minor'},style:bossa,
  thay:'ca-phao',caPhaoCompose:true,beatsPerChord:4,dropRoot:true,opening:null,
  range:{low:60,high:84},caPhaoKeyboardRange:{low:36,high:96},solo:()=>[]}

function chordAt(made:PhraseSection,at:number){
  let start=0,index=0
  while(index<made.beatsEach.length-1&&start+made.beatsEach[index]<=at+1e-6)start+=made.beatsEach[index++]
  return parseChordInput(made.chords[index]).chords[0]
}
function plannedBossa(made:PhraseSection){
  return made.compositionSources!.flatMap(trace=>{
    const cell=cpHandCells.find(c=>c.id===trace.rhythm)!
    return cell.events.map(e=>({...e,at:trace.start+e.at,
      gate:Math.min(made.lengthBeats-trace.start-e.at,
        Math.max(...e.gates)*(e.articulations.includes('staccato')?.5:1))}))
  })
}

it('approved Bossa rhythm and techniques remain fixed while training pitches',()=>{
  const result:Record<string,string>={}
  for(const scale of ['minor','major'] as const)for(const caPhaoFull of [false,true])
    for(const kind of ['intro','interlude','outro'] as const)for(const take of [0,3]){
      const made=buildPhraseSection({...base,key:{tonic:9,scale},kind,caPhaoFull,take})!
      expect(made.unavailableReason).toBeUndefined()
      // Harmony/pitches may change; compare the audible attacks, holds and accents
      // against the approved PRE-training engine, never re-record after a change.
      const attacks=made.events.filter((e,i,all)=>all.findIndex(n=>n.hand===e.hand&&n.startBeat===e.startBeat)===i)
      const skeleton={beats:made.beatsEach,
        gestures:made.compositionSources!.map(t=>t.rhythm),
        events:attacks.map(e=>[e.hand,e.startBeat,
          Math.max(...made.events.filter(n=>n.hand===e.hand&&n.startBeat===e.startBeat).map(n=>n.durationBeats)),e.velocity])}
      result[`${scale}/${caPhaoFull}/${kind}/${take}`]=createHash('sha256').update(JSON.stringify(skeleton)).digest('hex')
    }
  expect(result).toMatchSnapshot()
},30000)


it('minor learning retains source harmonic contexts, not a single diatonic pitch whitelist',()=>{
  const minor=cpMelodicContexts.filter(e=>e.mode==='minor')
  expect(new Set(minor.map(e=>e.source.split(':')[0])).size).toBe(4)
  const bossa=minor.filter(e=>e.source.startsWith('nguoihayquenemdi:'))
  // Native i9: 9 -> 1 -> b7; iv color is NOT evidence for tonic minor.
  expect(bossa).toEqual(expect.arrayContaining([
    expect.objectContaining({root:0,type:'minor',tone:0,from:2,direction:-1}),
    expect.objectContaining({root:0,type:'minor',tone:10,from:0,direction:-1}),
    expect.objectContaining({root:5,type:'minor',tone:9,held:true}),
    expect.objectContaining({root:2,type:'diminished',tone:1}),
    expect.objectContaining({root:1,type:'dominant',tone:6,held:true}),
    expect.objectContaining({root:7,type:'dominant',tone:8,held:true}),
  ]))
  expect(cpMelodicContexts.filter(e=>e.mode==='major').every(e=>!e.source.startsWith('nguoihayquenemdi:'))).toBe(true)
  // The rejected post-hoc top-note rewrite must not silently return.
  const code=readFileSync(new URL('../cpComposition.ts',import.meta.url),'utf8')
  expect(code).not.toContain('refineBossaPitches')
})

it('new minor Bossa retains native tonic/subdominant extensions on different tonics',()=>{
  let checked=0
  for(const tonic of [0,4,9] as const)for(const caPhaoFull of [false,true])for(let take=0;take<8;take++){
    const made=buildPhraseSection({...base,kind:'intro',key:{tonic,scale:'minor'},caPhaoFull,take})!
    expect(made.unavailableReason).toBeUndefined()
    let at=0
    for(const [i,symbol] of made.chords.entries()){
      const c=parseChordInput(symbol).chords[0],degree=(c.root-tonic+12)%12
      // The same root can instead be a secondary dominant inside bII -> V;
      // judge its function/quality, not the root's membership in the minor key.
      if(at<made.lengthBeats-8&&[0,5].includes(degree)&&c.quality.intervals.includes(3)){
        expect(symbol).toMatch(/m(9|11)$/)
        checked++
      }
      at+=made.beatsEach[i]
    }
  }
  expect(checked).toBeGreaterThan(40)
},30000)

it('CP color owns every fill/run route, including old snapshots and context menus',()=>{
  const app=readFileSync(new URL('../../ReharmHome.tsx',import.meta.url),'utf8')
  expect(app).toContain("const cpLick = intensity === 'caPhao' || cpLickSelected")
  expect(app).toContain("checked={cpLick} disabled={intensity === 'caPhao'}")
  expect(app).toContain('if (cpLick) return cpPlan(take).events')
  expect(app).toContain('const cpPass = cpLick ? cpPlan(pass) : null')
  expect(app).toContain('caPhaoCompose: cpComposeOn')
  expect(app).toContain('cpLick={cpLick}')
})


it('new solos preserve genre form, vary notes and colors, and fit all keys and keyboards',()=>{
  for(const style of [bossa,getStyle('pop-1')!]) for(const caPhaoFull of [false,true])
    for(const scale of ['minor','major'] as const) for(const kind of ['intro','interlude','outro'] as const){
      const harmony=new Set<string>(),roots=new Set<string>(),rhythms=new Set<string>(),melodies=new Set<string>()
      for(let take=0;take<12;take++){
        const tonic=take as PitchClass, keyboard=take%2?{low:48,high:84}:{low:36,high:96}
        const options={...base,style,caPhaoFull,kind,key:{tonic,scale},take,
          range:{low:62,high:79},caPhaoKeyboardRange:keyboard}
        const made=buildPhraseSection(options)!
        expect(made.unavailableReason,`${style.id}/${caPhaoFull}/${scale}/${kind}/${take}`).toBeUndefined()
        expect(made.sourcePhrase?.id).toBe('cp-original')
        expect(made.compositionSources).toHaveLength(made.lengthBeats/4)
        expect(made.compositionSources!.every(t=>t.mode===scale)).toBe(true)
        expect(made.beatsEach.reduce((a,b)=>a+b,0)).toBe(made.lengthBeats)
        expect(parseChordInput(made.chords.join(' ')).errors).toEqual([])
        expect(made.events.every(e=>e.durationBeats>0&&e.startBeat>=0&&e.startBeat+e.durationBeats<=made.lengthBeats+.001)).toBe(true)
        expect(made.events.every(e=>e.notes.every(n=>Number.isFinite(n)&&n>=keyboard.low&&n<=keyboard.high))).toBe(true)
        for(const e of made.events.filter(e=>e.hand==='right')){
          if(!caPhaoFull) expect(e.notes.every(n=>n>=62&&n<=79)).toBe(true)
          const chord=chordAt(made,e.startBeat)
          const allowed=new Set([...scaleTones(tonic,scale),...chord.quality.intervals.map(n=>(chord.root+n)%12)])
          for(const n of e.notes) if(!allowed.has(n%12)) {
            const cluster=made.compositionTechniques?.some(t=>t.kind==='neighbor-cluster'&&Math.abs(t.startBeat-e.startBeat)<.001)
            const resolves=made.events.some(next=>next.hand==='right'&&next.startBeat>e.startBeat&&next.startBeat<=e.startBeat+.5&&
              next.notes.some(p=>p===n+1&&allowed.has(p%12)))
            const voicedNeighbor=cluster&&e.durationBeats<=.125&&made.events.some(lead=>lead.hand==='right'&&
              lead.startBeat===e.startBeat&&lead.velocity>e.velocity&&lead.durationBeats>=e.durationBeats&&
              lead.notes.includes(n+1)&&chord.quality.intervals.some(p=>(chord.root+p)%12===(n+1)%12))
            expect(resolves||voicedNeighbor).toBe(true)
          }
        }
        // Compare in tonic-relative coordinates so transposition alone cannot pass diversity tests.
        const parsed=parseChordInput(made.chords.join(' ')).chords
        harmony.add(JSON.stringify(parsed.map(c=>[(c.root-tonic+12)%12,c.quality.intervals])))
        roots.add(JSON.stringify(parsed.map(c=>(c.root-tonic+12)%12)))
        rhythms.add(JSON.stringify(made.events.filter(e=>e.hand==='right').map(e=>[e.startBeat,e.durationBeats])))
        melodies.add(JSON.stringify(made.events.filter(e=>e.hand==='right').map(e=>e.notes.map(n=>n-tonic))))
        expect(buildPhraseSection(options)).toEqual(made)
      }
      expect(harmony.size).toBeGreaterThan(1)
      expect(roots.size).toBeGreaterThan(1)
      expect(rhythms.size).toBeGreaterThan(1)
      expect(melodies.size).toBeGreaterThan(1)
    }
},30000)

it('measures nine sheets, uses only confirmed modes and refuses incompatible meter',()=>{
  expect(cpCompositionEvidence).toMatchObject({measuredSheets:9,eligibleSheets:7,sections:21})
  expect(cpCompositionEvidence.techniques.every(t=>t.songs>=6)).toBe(true)
  expect(cpSoloCells.length).toBeGreaterThan(30)
  expect(buildPhraseSection({...base,style:{...bossa,beatsPerMeasure:3}})?.unavailableReason).toBeDefined()
  const code=readFileSync(new URL('../cpComposition.ts',import.meta.url),'utf8')
  expect(code).not.toContain('base.events')
  expect(code).not.toContain('placeCpPhrase')
  expect(code).not.toContain('caPhaoFullSolo(')
})

it('simulation retains the entire source and never develops with take or changes into major',()=>{
  const options={...base,caPhaoSimulate:true,caPhaoKeyboardRange:{low:21,high:108}}
  for(const kind of ['intro','interlude','outro'] as const){
    const made=buildPhraseSection({...options,kind,take:0})!
    expect(made.sourcePhrase?.method).toBe('full-sheet')
    expect(made.compositionSources).toBeUndefined()
    expect(buildPhraseSection({...options,kind,take:17})).toEqual(made)
    expect(made.lengthBeats).toBe(kind==='outro'?24:32)
  }
  expect(buildPhraseSection({...options,key:{tonic:0,scale:'major'}})?.unavailableReason).toBeDefined()
  const app=readFileSync(new URL('../../ReharmHome.tsx',import.meta.url),'utf8')
  expect(app).toContain('Cách tạo solo CP')
  expect(app).toContain('caPhaoSimulate: cpSimulationOn')
  expect(app).toContain("setCaPhaoSoloMode(saved.caPhaoSoloMode === 'simulate' ? 'simulate' : 'compose')")
})

it('new ending follows the actual next chord while outro closes on the song tonic',()=>{
  for(const scale of ['major','minor'] as const) for(const opening of ['Am','F','Dm','G']){
    const made=buildPhraseSection({...base,key:{tonic:4,scale},opening:parseChordInput(opening).chords[0]})!
    expect(parseChordInput(made.chords.at(-1)!).chords[0].root).toBe((parseChordInput(opening).chords[0].root+7)%12)
    const outro=buildPhraseSection({...base,kind:'outro',key:{tonic:4,scale}})!
    expect(parseChordInput(outro.chords.at(-1)!).chords[0].root).toBe(4)
  }
})

it('each fixed key changes notes and colors without requiring destructive rhythm changes',()=>{
  for(const caPhaoFull of [false,true]) for(const kind of ['intro','interlude','outro'] as const){
    const takes=Array.from({length:12},(_,take)=>buildPhraseSection({...base,caPhaoFull,kind,take})!)
    expect(new Set(takes.map(s=>JSON.stringify(s.chords))).size).toBeGreaterThan(1)
    expect(new Set(takes.map(s=>JSON.stringify(s.events.filter(e=>e.hand==='right').map(e=>e.notes)))).size).toBeGreaterThan(1)
    const rhythms=takes.map(s=>JSON.stringify(s.events.filter(e=>e.hand==='right').map(e=>[e.startBeat,e.durationBeats])))
    expect(new Set(rhythms).size).toBeGreaterThan(1)
    expect(new Set(takes.map(s=>s.lengthBeats)).size).toBe(1)
  }
})

it('same-key wide-keyboard simulation preserves every source pitch, pickup, grace and written harmony',()=>{
  for(const source of sources.sections){
    const made=buildPhraseSection({...base,style:source.genre==='bossa nova'?bossa:getStyle('pop-1')!,
      kind:source.kind as PhraseSectionOptions['kind'],key:{tonic:source.tonic as PitchClass,scale:source.mode as 'major'|'minor'},
      caPhaoSimulate:true,caPhaoFullSource:source.song,caPhaoKeyboardRange:{low:0,high:127}})!
    expect(made.unavailableReason).toBeUndefined()
    expect(made.events.flatMap(e=>e.notes).sort((a,b)=>a-b)).toEqual([
      ...source.events.flatMap(e=>e.tones.map(n=>n+source.tonic)),
      ...source.graces.map(g=>g.tone+source.tonic)].sort((a,b)=>a-b))
    expect(made.beatsEach).toEqual(source.writtenHarmony.map((h,i)=>(source.writtenHarmony[i+1]?.at??source.lengthBeats)-h.at))
    for(const e of source.events.filter(e=>!e.arpeggiate&&!source.graces.some(g=>g.at===e.at&&g.hand===e.hand)))
      expect(made.events.filter(n=>n.hand===e.hand&&Math.abs(n.startBeat-e.at)<1e-5).flatMap(n=>n.notes).sort((a,b)=>a-b))
        .toEqual(source.events.filter(g=>g.hand===e.hand&&g.at===e.at).flatMap(g=>g.tones.map(n=>n+source.tonic)).sort((a,b)=>a-b))
  }
})

it('Bossa keeps local joint gestures, not a whole sheet order; no extra silence at seams',()=>{
  expect(cpBossaConnections.some(c=>c.held>c.step)).toBe(true)
  let heldAcross=0,paired=0
  for(const caPhaoFull of [false,true])for(const kind of ['intro','interlude','outro'] as const)
    for(const scale of ['major','minor'] as const)for(let take=0;take<12;take++){
      const made=buildPhraseSection({...base,kind,caPhaoFull,take,key:{tonic:4,scale},range:{low:62,high:79}})!
      expect(made.unavailableReason,`${kind}/${caPhaoFull}/${scale}/${take}`).toBeUndefined()
      const native=plannedBossa(made)
      const right=made.events.filter(e=>e.hand==='right')
      // A tied inner voice may be a separate event at the SAME onset; it is not
      // another melodic attack and must not create a fictitious register leap.
      const melody=right.filter(e=>!right.some(n=>n.startBeat===e.startBeat&&n.notes.at(-1)!>e.notes.at(-1)!))
      const tops=melody.map(e=>e.notes.at(-1)!)
      for(const e of native){
        expect(made.events.some(n=>n.hand===e.hand&&Math.abs(n.startBeat-e.at)<.001),
          `${kind}: missing ${e.hand} at ${e.at}`).toBe(true)
      }
      // One held single RH note may subdivide; all written attacks survive.
      const extras=right.filter(e=>!native.some(n=>n.hand==='right'&&Math.abs(n.at-e.startBeat)<.001))
      expect(extras.length).toBeLessThanOrEqual(1)
      for(const e of extras){
        const original=native.find(n=>n.hand==='right'&&n.at===e.startBeat-.25)!
        expect(original.tones).toHaveLength(1)
        expect(original.gate).toBe(.5)
        expect(e.durationBeats).toBe(.25)
      }
      const leftTimes=[...new Set(made.events.filter(e=>e.hand==='left').map(e=>e.startBeat))]
      expect(leftTimes).toEqual(native.filter(e=>e.hand==='left').map(e=>e.at))
      for(let beat=4;beat<made.lengthBeats;beat+=4){
        const gap=(events:{at:number;gate:number}[])=>{
          const before=Math.max(0,...events.filter(e=>e.at<beat).map(e=>e.at+e.gate))
          const after=Math.min(made.lengthBeats,...events.filter(e=>e.at>=beat).map(e=>e.at))
          return Math.max(0,after-before)
        }
        expect(gap(made.events.map(e=>({at:e.startBeat,gate:e.durationBeats}))),
          `${kind}/${scale}/${take}: break at ${beat}; ${made.chords}; ${made.compositionSources?.[0].rhythm}`).toBeLessThanOrEqual(gap(native)+.001)
        heldAcross+=right.filter(e=>e.startBeat<beat&&e.startBeat+e.durationBeats>beat+.01).length
      }
      for(let i=2;i<tops.length;i++){
        if(melody[i].notes.length===1&&melody.slice(i-3,i+1).every(e=>
          native.find(n=>n.hand==='right'&&n.at===e.startBeat)?.tones.length===1)){
          expect(tops[i]===tops[i-1]&&tops[i-1]===tops[i-2]).toBe(false)
          if(i>=3)expect(tops[i]===tops[i-2]&&tops[i-1]===tops[i-3]).toBe(false)
        }
        expect(Math.abs(tops[i]-tops[i-1])).toBeLessThanOrEqual(12)
      }
      paired+=right.filter(e=>e.notes.length>1).length
    }
  expect(heldAcross).toBeGreaterThan(20)
  expect(paired).toBeGreaterThan(100)
},30000)

it('performance solos retain source punches and bass below the melody with local minor color',()=>{
  let stamped=0,total=0,repeatedStamps=0
  expect(cpBossaRhythmGestures.length).toBeGreaterThan(10)
  expect(cpBossaRhythmGestures.every(g=>Math.abs(g.steps.reduce((a,b)=>a+b,0)-2)<.001)).toBe(true)
  for(const caPhaoFull of [false,true]) for(const kind of ['intro','interlude','outro'] as const)
    for(const scale of ['minor','major'] as const) for(let take=0;take<24;take++){
      const tonic=take%12 as PitchClass
      const made=buildPhraseSection({...base,caPhaoFull,kind,take,key:{tonic,scale},
        caPhaoKeyboardRange:take%2?{low:48,high:84}:{low:21,high:108}})!
      expect(made.unavailableReason).toBeUndefined()
      const right=made.events.filter(e=>e.hand==='right')
      const gestures=right.filter(e=>e.notes.length>1)
      stamped+=gestures.length;total+=right.length
      // Intro stays predominantly linear; the source's interlude/outro are
      // chord-led. Do not impose the intro's density ceiling on those sections.
      expect(gestures.length/right.length,`${kind}/${scale}/${caPhaoFull}/${take}`).toBeLessThanOrEqual(kind==='intro'?.6:.85)
      const native=plannedBossa(made)
      for(const e of gestures){
        expect(e.notes.length).toBeLessThanOrEqual(4)
        const written=native.find(n=>n.hand==='right'&&Math.abs(n.at-e.startBeat)<.001)!
        expect(written.tones.length).toBeGreaterThan(1)
        expect(e.notes.length).toBeLessThanOrEqual(written.tones.length)
        if(e.notes.length>=3)expect(e.velocity).toBeGreaterThanOrEqual(80)
      }
      repeatedStamps+=gestures.slice(1).filter((e,i)=>JSON.stringify(e.notes)===JSON.stringify(gestures[i].notes)).length
      for(const e of right){
        const chord=chordAt(made,e.startBeat)
        const stable=new Set(chord.quality.intervals.map(n=>(chord.root+n)%12))
        // A raised seventh is local to a dominant or a short resolving pickup,
        // not a sustained note over a natural-minor chord (#1008's D vs D#).
        if(scale==='minor'&&e.durationBeats>=.5 && e.notes.some(n=>n%12===(tonic+11)%12))
          expect(stable.has((tonic+11)%12)).toBe(true)
      }
      for(const l of made.events.filter(e=>e.hand==='left')){
        expect(l.velocity).toBeGreaterThanOrEqual(66)
        const harmony=chordAt(made,l.startBeat)
        const stable=new Set(harmony.quality.intervals.map(n=>(harmony.root+n)%12))
        if(harmony.bass!==undefined)stable.add(harmony.bass)
        for(const n of l.notes)if(!stable.has(n%12)){
          expect(l.durationBeats).toBeLessThanOrEqual(.5)
          expect(made.events.some(e=>e.hand==='left'&&e.startBeat>l.startBeat&&e.startBeat<=l.startBeat+.5&&
            e.notes.some(p=>Math.abs(p-n)===1&&stable.has(p%12))),`${kind}/${scale}/${take}: unresolved bass ${n} at ${l.startBeat}`).toBe(true)
        }
        for(const r of right.filter(r=>r.startBeat<l.startBeat+l.durationBeats-1e-6 &&
          l.startBeat<r.startBeat+r.durationBeats-1e-6)){
          if(l.notes[0]>Math.min(...r.notes)-2){
            expect(kind).toBe('intro');expect(scale).toBe('minor')
            expect(r.notes).toHaveLength(1)
            expect(l.notes[0]).toBe(r.notes[0]+1)
            expect(l.durationBeats).toBeLessThanOrEqual(.5)
            expect((r.notes[0]-chordAt(made,l.startBeat).root+120)%12).toBe(2)
            expect(made.events.some(b=>b.hand==='left'&&b.startBeat===l.startBeat&&b.notes[0]<r.notes[0]-2)).toBe(true)
          }else expect(l.notes[0]).toBeLessThanOrEqual(60)
        }
      }
    }
  expect(stamped/total).toBeGreaterThan(.1)
  expect(repeatedStamps).toBeGreaterThan(0)
},30000)

it('other sheets contribute same-mode run contours only inside existing Bossa windows',()=>{
  const families=new Set<string>(),sourceKinds=new Set<string>(),contours=new Set<string>()
  let heldUnderRun=0,delayedBass=0
  for(const scale of ['major','minor'] as const)for(const caPhaoFull of [false,true])for(let take=0;take<20;take++){
    const made=buildPhraseSection({...base,kind:'intro',caPhaoFull,take,key:{tonic:9,scale}})!
    expect(made.unavailableReason).toBeUndefined()
    const shapes=new Set<string>()
    for(const trace of made.compositionSources!.filter(t=>t.melody.includes(';contour:'))){
      const ref=trace.melody.split(';contour:')[1]
      const shape=cpRunShapes.find(s=>ref===s.family+':'+s.id)!
      expect(shape.mode).toBe(scale)
      expect(shapes.has(shape.motion.join(','))).toBe(false)
      shapes.add(shape.motion.join(','));families.add(shape.family);sourceKinds.add(shape.kind)
    }
    const right=made.events.filter(e=>e.hand==='right')
    contours.add(JSON.stringify(right.map(e=>e.notes.at(-1))))
    for(const trace of made.compositionSources!){
      const left=made.events.filter(e=>e.hand==='left'&&e.startBeat>=trace.start&&e.startBeat<trace.end)
      if(!left.some(e=>e.startBeat===trace.start))delayedBass++
    }
    for(const r of right.filter(e=>e.notes.length===1&&e.durationBeats<=.5))
      if(made.events.some(l=>l.hand==='left'&&l.startBeat<r.startBeat&&l.startBeat+l.durationBeats>r.startBeat))heldUnderRun++
  }
  expect(families.size).toBeGreaterThan(1)
  expect(sourceKinds.size).toBeGreaterThan(1)
  expect(contours.size).toBeGreaterThan(30)
  expect(heldUnderRun).toBeGreaterThan(0)
  expect(delayedBass).toBeGreaterThan(0)
},30000)

it('a selected bII to V punch retains BOTH hands and resolves into its actual local destination',()=>{
  let punches=0
  for(const caPhaoFull of [false,true])for(const kind of ['intro','interlude','outro'] as const)
    for(let take=0;take<16;take++){
      const made=buildPhraseSection({...base,caPhaoFull,kind,take})!
      expect(made.unavailableReason).toBeUndefined()
      for(const trace of made.compositionSources!.filter(t=>t.rhythm==='nguoihayquenemdi:outro:hands:4')){
        punches++
        const at=trace.start,next=chordAt(made,at+4).root
        expect(chordAt(made,at).root).toBe((next+1)%12)
        expect(chordAt(made,at+2).root).toBe((next+7)%12)
        const left=made.events.filter(e=>e.hand==='left'&&e.startBeat>=at&&e.startBeat<at+4)
        expect(left.map(e=>[e.startBeat-at,e.durationBeats])).toEqual([[0,1.5],[1.5,.5],[2,1.5],[3.5,.5]])
        const right=made.events.filter(e=>e.hand==='right'&&e.startBeat>=at&&e.startBeat<at+4)
        expect(right.map(e=>[e.startBeat-at,e.durationBeats])).toEqual([[.5,.25],[1.25,.125],[2,1],[3,1]])
      }
    }
  expect(punches).toBeGreaterThan(5)
},30000)

it('new plans vary episode order; compact and full never reproduce the native solo stencil',()=>{
  for(const caPhaoFull of [false,true])for(const kind of ['intro','interlude','outro'] as const){
    const orders=new Set<string>()
    for(let take=0;take<16;take++){
      const made=buildPhraseSection({...base,kind,caPhaoFull,take})!
      expect(made.unavailableReason).toBeUndefined()
      const traces=made.compositionSources!
      const ids=traces.map(t=>t.rhythm)
      orders.add(ids.join('|'))
      expect(new Set(ids).size).toBe(ids.length)
      const old=(caPhaoFull?(kind==='outro'?[0,8,16]:[0,8,16,24]):
        kind==='interlude'?[0,8,24]:kind==='intro'?[0,24]:[0,16])
        .flatMap(from=>[from,from+4].map(at=>'nguoihayquenemdi:'+kind+':hands:'+at))
      expect(ids).not.toEqual(old)
      expect(made.lengthBeats).toBe(caPhaoFull?(kind==='outro'?24:32):kind==='interlude'?24:16)
      expect(traces.at(-1)!.melody).toContain(kind==='outro'?'bossa-plan:settle':'bossa-plan:lead-in')
      expect(traces[0].melody).toContain(';theme:')
      expect(traces[0].melody).not.toContain(';theme:nguoihayquenemdi:')
    }
    expect(orders.size).toBeGreaterThan(1)
  }
},30000)

it('a punch before the last episode resolves to the finalized lead-in, not its provisional ii',()=>{
  let checked=0,changedDestination=0
  for(const symbol of ['Am','Dm','F','G'])for(let take=0;take<24;take++){
    const made=buildPhraseSection({...base,kind:'interlude',caPhaoFull:true,take,
      opening:parseChordInput(symbol).chords[0]})!
    expect(made.unavailableReason).toBeUndefined()
    const punch=made.compositionSources!.find(t=>t.start===20&&t.rhythm==='nguoihayquenemdi:outro:hands:4')
    if(!punch)continue
    const target=chordAt(made,24)
    expect(chordAt(made,20).root).toBe((target.root+1)%12)
    expect(chordAt(made,22).root).toBe((target.root+7)%12)
    if(target.root!==(parseChordInput(symbol).chords[0].root+2)%12)changedDestination++
    checked++
  }
  expect(checked).toBeGreaterThan(0)
  expect(changedDestination).toBeGreaterThan(0)
},30000)

it('intro and interlude contain an audible lead-in to the real next chord in both modes',()=>{
  for(const caPhaoFull of [false,true])for(const kind of ['intro','interlude'] as const)
    for(const scale of ['major','minor'] as const)for(const symbol of ['Am','Dm','F','G']){
      const opening=parseChordInput(symbol).chords[0]
      const made=buildPhraseSection({...base,kind,caPhaoFull,key:{tonic:4,scale},opening})!
      expect(made.unavailableReason,`${kind}/${scale}/${symbol}`).toBeUndefined()
      const last=made.events.filter(e=>e.hand==='right').at(-1)!
      expect(chordAt(made,last.startBeat).root).toBe((opening.root+7)%12)
      expect(last.startBeat).toBeGreaterThanOrEqual(made.lengthBeats-1)
      expect(last.startBeat+last.durationBeats).toBe(made.lengthBeats)
      // A dominant guide tone leads by step into the next chord, not the donor key.
      const targets=opening.quality.intervals.slice(0,3).map(n=>(opening.root+n)%12)
      expect(targets.some(n=>Math.min((n-last.notes.at(-1)!%12+12)%12,
        (last.notes.at(-1)!%12-n+12)%12)<=2)).toBe(true)
    }
},30000)

it('simulation already preserves the original Bb9 to E7b13 bass and must not be simplified',()=>{
  for(const keyboard of [{low:21,high:108},{low:48,high:84}]){
    const made=buildPhraseSection({...base,kind:'outro',caPhaoSimulate:true,caPhaoKeyboardRange:keyboard})!
    const left=made.events.filter(e=>e.hand==='left'&&e.startBeat>=4&&e.startBeat<8)
    expect(left.map(e=>[e.startBeat,e.durationBeats,e.notes[0]%12])).toEqual([
      [4,1.5,10],[5.5,.5,10],[6,1.5,4],[7.5,.5,4]])
  }
})

it('Bossa solo bass gestures retain octave support and never use the sung loop',()=>{
  expect(new Set(cpHandCells.map(c=>c.id.split(':')[0])).size).toBe(7)
  const used=new Set<string>()
  let octaves=0,shortAnswers=0,heldUnderRuns=0
  for(const style of [bossa])for(const scale of ['minor','major'] as const)
    for(let take=0;take<8;take++){
      const made=buildPhraseSection({...base,style,key:{tonic:9,scale},caPhaoFull:true,take})!
      expect(made.unavailableReason).toBeUndefined()
      for(const trace of made.compositionSources!){
        used.add(trace.rhythm)
        const cell=cpHandCells.find(c=>c.id===trace.rhythm)!
        expect(cell.genre).toBe(style===bossa?'bossa':'ballad')
        if(style!==bossa)expect(cell.mode).toBe(scale)
      }
      const left=made.events.filter(e=>e.hand==='left'),right=made.events.filter(e=>e.hand==='right')
      for(const e of left){
        octaves+=left.filter(n=>n.startBeat===e.startBeat&&n.notes[0]===e.notes[0]+12).length
        if(e.durationBeats<=.25)shortAnswers++
        if(e.durationBeats>=1&&right.filter(r=>r.startBeat>=e.startBeat&&r.startBeat<e.startBeat+e.durationBeats).length>=3)heldUnderRuns++
      }
    }
  expect(used.size).toBeGreaterThan(10)
  expect(octaves).toBeGreaterThan(0)
  expect(shortAnswers).toBeGreaterThan(0)
  expect(heldUnderRuns).toBeGreaterThan(0)
  const code=readFileSync(new URL('../cpComposition.ts',import.meta.url),'utf8')
  expect(code).not.toContain('renderPattern(')
},30000)

it('full-play alone requests a new take; chord seeking and automatic repeat reuse heard events',()=>{
  const app=readFileSync(new URL('../../ReharmHome.tsx',import.meta.url),'utf8')
  const start=app.indexOf('const playFromBeat = useCallback(')
  const stop=app.indexOf('const playFromSourceBeat = useCallback(',start)
  const play=app.slice(start,stop)
  expect(play).toContain('recompose = false')
  const seek=play.slice(play.indexOf('if (!recompose)'),play.indexOf('playSpin.current += 1'))
  expect(seek).toContain('eventsForHand(heard.events, hand)')
  expect(seek).toContain('return')
  expect(seek).not.toMatch(/buildPass\(|luuCauDao\(|advanceRound\(|setPhraseSpin\(/)
  expect(play).toContain('buildPlaybackPass(),')
  expect(app.match(/playFromBeat\(0, 0, true\)/g)).toHaveLength(3)
  expect(app).toContain('arrangedBeatAt(heard.segments, sourceBeat, heard.sections)')
})
