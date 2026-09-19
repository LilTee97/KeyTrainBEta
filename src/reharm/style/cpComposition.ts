import sources from './caPhaoFullSolos.json'
import { cpGenre, cpPhrases, type CpPhrase } from '../licky/cpLick'
import { parseChordInput } from '../input/chordInputParser'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import { degreesOf } from '../../shared/musicTheory/scales'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import type { TimelineEvent } from './types'

const pc = (n: number) => ((n % 12 + 12) % 12) as PitchClass
type Harmony = typeof sources.sections[number]['harmony'][number]
type Cell = { id: string; song: string; genre: string; mode: string; kind: string;
  bar: number; harmony: Harmony[]; phrase: CpPhrase }
export const cpHarmonyCells: Omit<Cell,'phrase'>[] = []

// Measure once, outside React/playback. One observation per written bar, not overlapping licks.
export const cpSoloCells: readonly Cell[] = sources.sections.flatMap(source => {
  let start = 0
  return source.barLengths.flatMap((length, bar): Cell[] => {
    const at = start
    start += length
    if (length !== 4 || (source.vocalPickupAt !== null && start > source.vocalPickupAt)) return []
    const first = source.harmony.findLast(h => h.at <= at)
    if (!first) return []
    const harmony = [{ ...first, at: 0 }, ...source.harmony
      .filter(h => h.at > at && h.at < start).map(h => ({ ...h, at: h.at-at }))]
    const genre = source.genre === 'bossa nova' ? 'bossa' : source.genre
    const id = source.id+':bar'+(source.fromBar+bar)
    cpHarmonyCells.push({id,song:source.song,genre,mode:source.mode,kind:source.kind,bar:source.fromBar+bar,harmony})
    const right = source.events.filter(e => e.hand === 'right' && e.at >= at && e.at < start)
    // No cut ties, grace clusters or tuplets from another meter disguised as a straight cell.
    if (right.length < 3 || right.length > 16 || right.some(e => e.carry ||
      Math.abs(e.at*4-Math.round(e.at*4)) > .001 || e.gates.some(g => e.at+g > start+.001)) ||
      source.graces.some(g => g.at >= at && g.at < start)) return []
    const notes = right.map(e => ({ at:e.at-at, dur:Math.max(...e.gates),
      gates:[...e.gates], tones:e.tones.map(n => n-60) }))
    const phrase: CpPhrase = { ...cpPhrases[0], id:source.id+':bar'+(source.fromBar+bar),
      song:source.song, genre, mode:source.mode, bar:source.fromBar+bar, hand:'right',
      meter:4, span:4, notes, support:[], supportComplete:true }
    return [{ id:phrase.id, song:source.song, genre, mode:source.mode, kind:source.kind,
      bar:source.fromBar+bar, harmony, phrase }]
  })
})

/** Counts are corpus evidence, not a claim that every semitone is an intentional ornament. */
export const cpCompositionEvidence = {
  measuredSheets: sources.inventory.length,
  eligibleSheets: new Set(sources.sections.map(s => s.song)).size,
  sections: sources.sections.length,
  techniques: [...new Set(sources.sections.flatMap(s => s.techniques))].map(technique => ({
    technique,
    sections: sources.sections.filter(s => s.techniques.includes(technique)).length,
    songs: new Set(sources.sections.filter(s => s.techniques.includes(technique)).map(s => s.song)).size,
  })),
}


type Role = 'question' | 'answer' | 'develop' | 'run' | 'recall' | 'cadence'

// Include sustained/cross-bar attacks when learning connections. Excluding these
// (as the old single-bar donor filter did) systematically teaches detached playing.
const bossaSections=sources.sections.filter(s=>s.genre==='bossa nova')
// Keep the relationship between the hands, including rests and staccato gates.
// Bossa keeps these cells in their native paired order; Ballad may select locally.
export const cpHandCells=sources.sections.flatMap(source=>{
  let start=0
  return source.barLengths.flatMap(length=>{
    const at=start;start+=length
    if(length!==4 || source.genre!=='bossa nova'&&source.vocalPickupAt!==null&&start>source.vocalPickupAt)return []
    const events=source.events.filter(e=>e.at>=at&&e.at<start)
    const right=events.filter(e=>e.hand==='right')
    // A parallel-major ending can teach hand timing / chord-degree roles, NOT
    // major melodic pitches in minor. cpRunShapes and note learning exclude it.
    if(!right.length)return []
    const carryBeats=Math.max(0,...source.events.filter(e=>e.hand==='left'&&e.at<at)
      .flatMap(e=>e.gates.map(g=>Math.max(0,e.at+g-at))))
    return [{id:source.id+':hands:'+at,genre:source.genre==='bossa nova'?'bossa':source.genre,
      mode:source.mode,kind:source.kind,position:at/source.lengthBeats,carryBeats,events:events.map(e=>({...e,at:e.at-at,
        harmony:source.harmony.findLast(h=>h.at<=e.at)!})),
      right:events.filter(e=>e.hand==='right').map(e=>e.at-at)}]
  })
})
type HandCell=typeof cpHandCells[number]
type BossaJob='statement'|'develop'|'contrast'|'lead-in'|'settle'
// Local paired-hand vocabulary, NOT a complete song stencil. Never separate a
// bass anticipation from its answer or splice the middle of a tuplet.
const bossaGestures=bossaSections.flatMap(source=>Array.from({length:source.lengthBeats/8},(_,i)=>{
  const from=i*8,right=source.events.filter(e=>e.hand==='right'&&e.at>=from&&e.at<from+8)
  const punch=right.filter(e=>e.tones.length>=3).length/right.length>=.35
  return {source,from,id:source.id+':pair:'+from,punch,
    lead:source.kind!=='outro'&&from===24,settle:source.kind==='outro'&&from===16}
}))
type BossaPlan=Array<typeof bossaGestures[number]&{job:BossaJob}>
function planBossa(kind:PhraseSectionOptions['kind'],blocks:number,random:()=>number):BossaPlan{
  const pick=<T,>(xs:T[])=>xs[Math.floor(random()*xs.length)]
  const plan:BossaPlan=[]
  const contrast=blocks>2?1+Math.floor(random()*(blocks-2)):-1
  for(let block=0;block<blocks;block++){
    const job:BossaJob=block===blocks-1?(kind==='outro'?'settle':'lead-in'):
      block===0?'statement':block===contrast?'contrast':'develop'
    // Intro speaks linearly before its one chord-led contrast. Interlude gets a
    // chord-led statement, then a run/answer before another chord episode.
    const punch=job==='statement'?kind!=='intro':job==='contrast'?kind==='intro':kind==='interlude'
    let pool=bossaGestures.filter(g=>!plan.some(p=>p.id===g.id)&&
      (job==='settle'?g.settle:job==='lead-in'?g.lead:!g.lead&&!g.settle&&g.punch===punch))
    // A whole archived phrase (even the old compact cut) is not a new composition.
    pool=pool.filter(g=>block!==blocks-1||!plan.every(p=>p.source.kind===kind&&p.from===plan.indexOf(p)*8)||
      g.source.kind!==kind||g.from!==block*8)
    if(job==='lead-in'&&blocks===2&&plan[0].source.kind==='intro'&&plan[0].from===0)
      pool=pool.filter(g=>g.source.kind!=='intro')
    if(job==='statement'&&kind==='outro'&&blocks===2)pool=pool.filter(g=>g.source.kind!=='outro'||g.from!==0)
    plan.push({...pick(pool),job})
  }
  return plan
}
type SoloChord=ReturnType<typeof parseChordInput>['chords'][number]
const chordIndexAt=(starts:readonly number[],at:number)=>Math.max(0,starts.findLastIndex(t=>t<=at+1e-6))

const melodyChordType=(intervals:readonly number[])=>intervals.includes(6)?'diminished':
  intervals.includes(3)?'minor':intervals.includes(10)?'dominant':'major'
// Keep local harmonic function and the approach to a color together. Counts of
// notes in a key alone cannot distinguish tonic 9 from ii-half-diminished b9.
export const cpMelodicContexts=sources.sections.flatMap(source=>{
  const right=source.events.filter(e=>e.hand==='right'&&!e.parallelMajor&&
    (source.vocalPickupAt===null||e.at<source.vocalPickupAt))
  return right.flatMap((e,i)=>{
    const h=source.harmony.findLast(h=>h.at<=e.at),before=right[i-1],next=right[i+1]
    if(!h)return []
    const chord=parseChordInput('C'+h.suffix).chords[0]
    if(!chord)return []
    const linked=before&&before.at>=h.at&&e.at-before.at<=1.5
    const following=next&&next.at-e.at<=.501&&source.harmony.findLast(h=>h.at<=next.at)===h
    const duration=e.gates.at(-1)!*(e.articulations.includes('staccato')?.5:1)
    return [{source:source.id,genre:source.genre,mode:source.mode,root:h.root,suffix:h.suffix,
      type:melodyChordType(chord.quality.intervals),tone:pc(Math.max(...e.tones)-h.root),
      held:duration>=.5,duration,
      from:linked?pc(Math.max(...before.tones)-h.root):null,
      approach:!!(linked&&following&&e.at-before.at<=.501&&e.tones.length===1),
      to:following?pc(Math.max(...next.tones)-h.root):null,
      nextDirection:following?Math.sign(Math.max(...next.tones)-Math.max(...e.tones)):0,
      direction:linked?Math.sign(Math.max(...e.tones)-Math.max(...before.tones)):0}]
  })
})

/** A chromatic note needs its measured preparation AND resolution, not a slot number. */
export function cpHasApproach(chord:SoloChord,key:NonNullable<PhraseSectionOptions['key']>,
  before:number,pickup:number,target:number){
  return cpMelodicContexts.some(e=>e.mode===key.scale&&e.root===pc(chord.root-key.tonic)&&
    e.type===melodyChordType(chord.quality.intervals)&&e.approach&&e.duration<=.334&&
    e.from===pc(before-chord.root)&&e.tone===pc(pickup-chord.root)&&e.to===pc(target-chord.root)&&
    e.direction===Math.sign(pickup-before)&&e.nextDirection===Math.sign(target-pickup))
}

// Learn complete short contours, not an alternating +/- (4,2,2) formula.
// Ballad contributes interval relationships only; Bossa authors its own timing.
export const cpRunShapes=sources.sections.flatMap(source=>{
  const r=source.events.filter(e=>e.hand==='right'&&!e.parallelMajor&&
    (source.vocalPickupAt===null||e.at<source.vocalPickupAt))
  return r.flatMap((_,from)=>[4,6,8,10,12].flatMap(count=>{
    const group=r.slice(from,from+count)
    if(group.length!==count||group.some(e=>e.tones.length>2)||
      group.slice(1).some((e,i)=>e.at-group[i].at>.501||e.at-group[i].at<.12))return []
    const motion=group.slice(1).map((e,i)=>Math.max(...e.tones)-Math.max(...group[i].tones))
    if(motion.some(n=>Math.abs(n)>12)||motion.every(n=>n===0))return []
    const turns=motion.slice(1).filter((n,i)=>n*motion[i]<0).length
    const skips=motion.filter(n=>Math.abs(n)>=3).length
    const family=turns>=2?'weave':turns===1?'turn':skips>=motion.length/2?'broken-chord':'stepwise'
    return [{id:source.id+':run:'+from+':'+count,mode:source.mode,kind:source.kind,
      family,motion,position:group[0].at/source.lengthBeats}]
  }))
})

/** Revoice bass/inner voices by chord function. Rhythm is native to the genre;
 * major/minor comes from the destination harmony, never absolute donor notes. */
function composeLeftHand(cell:HandCell,start:number,chords:SoloChord[],starts:number[],
  right:TimelineEvent[],keyboard:{low:number;high:number},length:number):TimelineEvent[] {
  const result:TimelineEvent[]=[]
  let previous=right.findLast(e=>e.hand==='left')?.notes[0]??keyboard.low+7
  const left=cell.events.filter(e=>e.hand==='left')
  for(const [eventIndex,e] of left.entries()){
    const at=start+e.at,index=chordIndexAt(starts,at),chord=chords[index]
    const end=length
    const sourceChord=parseChordInput('C'+e.harmony.suffix).chords[0]
    const sourceIntervals=sourceChord.quality.intervals
    const mapTone=(n:number)=>{
      const relative=pc(n-e.harmony.root),degree=sourceIntervals.findIndex(i=>pc(i)===relative)
      if(relative===pc((e.harmony.bass??e.harmony.root)-e.harmony.root))return chord.bass??chord.root
      // Keep root/fifth/third/seventh roles; unsupported colors become a chord tone.
      const step=degree>=0?chord.quality.intervals[Math.min(degree,chord.quality.intervals.length-1)]:
        chord.quality.intervals.reduce((a,b)=>Math.min(pc(b-relative),pc(relative-b))<Math.min(pc(a-relative),pc(relative-a))?b:a)
      return pc(chord.root+step)
    }
    const mapped=e.tones.map(mapTone)
    const next=left[eventIndex+1]
    // A weak bass semitone pickup is a connection, not a new chord tone. Keep it
    // only when the source resolves immediately under the SAME local harmony.
    if(e.tones.length===1&&next?.tones.length===1&&next.harmony.at===e.harmony.at&&
      next.at-e.at<=.5&&e.at%1!==0&&Math.abs(next.tones[0]-e.tones[0])===1&&
      !sourceIntervals.some(n=>pc(n)===pc(e.tones[0]-e.harmony.root))&&
      sourceIntervals.some(n=>pc(n)===pc(next.tones[0]-e.harmony.root)))
      mapped[0]=pc(mapTone(next.tones[0])-Math.sign(next.tones[0]-e.tones[0]))
    // Fit the voicing as a unit first, retaining octave basses whenever possible.
    const dur=Math.min(Math.max(...e.gates)*(e.articulations.includes('staccato')?.5:1),end-at)
    // Choose a shared tone BEFORE register fitting instead of cutting the bass
    // at a chord boundary. This keeps written anticipation/ties in both modes.
    for(let i=0;i<mapped.length;i++){
      const gate=Math.min(dur,e.gates[i]*(e.articulations.includes('staccato')?.5:1))
      const following=chords.filter((_,j)=>j>index&&starts[j]<at+gate-.001)
      if(!following.length)continue
      const holds=(tone:number,c:SoloChord)=>c.bass===tone||c.quality.intervals.some(n=>pc(c.root+n)===tone)
      if(following.every(c=>holds(mapped[i],c)))continue
      const common=chord.quality.intervals.map(n=>pc(chord.root+n)).filter(n=>following.every(c=>holds(n,c)))
      if(common.length)mapped[i]=common.reduce((a,b)=>Math.min(pc(b-mapped[i]),pc(mapped[i]-b))<
        Math.min(pc(a-mapped[i]),pc(mapped[i]-a))?b:a)
    }
    const overlap=right.filter(r=>r.hand==='right'&&r.startBeat<at+dur-1e-6&&at<r.startBeat+r.durationBeats-1e-6)
    const ceiling=Math.min(keyboard.high,Math.max(60,keyboard.low+11),...overlap.map(r=>Math.min(...r.notes)-2))
    const lowest=keyboard.low+pc(mapped[0]-keyboard.low)
    const voicing=[lowest]
    for(let i=1;i<mapped.length;i++){
      let n=voicing[i-1]+pc(mapped[i]-voicing[i-1])
      if(n===voicing[i-1]&&e.tones[i]>e.tones[i-1])n+=12
      voicing.push(n)
    }
    const shifts=[0,12,24].filter(shift=>voicing.at(-1)!+shift<=ceiling)
    const direction=eventIndex?Math.sign(e.tones[0]-left[eventIndex-1].tones[0]):0
    const cost=(shift:number)=>Math.abs(voicing[0]+shift-previous)+
      (direction&&Math.sign(voicing[0]+shift-previous)!==direction?1:0)
    const shift=shifts.length?shifts.reduce((a,b)=>cost(b)<cost(a)?b:a):0
    const notes=[...new Set(voicing.map(n=>{n+=shift;while(n>ceiling)n-=12;return n}))]
    if(notes.some(n=>n<keyboard.low)||dur<=0)return []
    previous=Math.min(...notes)
    notes.forEach((n,i)=>{
      let gate=Math.min(dur,e.gates[Math.min(i,e.gates.length-1)]*(e.articulations.includes('staccato')?.5:1))
      for(let j=index+1;j<starts.length&&starts[j]<at+gate-.001;j++)
        if(chords[j].bass!==pc(n)&&!chords[j].quality.intervals.some(step=>pc(chords[j].root+step)===pc(n))){gate=starts[j]-at;break}
      result.push({hand:'left',notes:[n],startBeat:at,durationBeats:gate,
        velocity:e.articulations.includes('staccato')?72:e.at%1===0?70:66})
    })
  }
  // Register fitting must not turn a semitone resolution into an octave jump.
  // Move the pickup to its actual target's octave, or use a stable bass instead.
  for(const e of result){
    const chord=chords[chordIndexAt(starts,e.startBeat)]
    const stable=new Set(chord.quality.intervals.map(n=>pc(chord.root+n)))
    if(chord.bass!==undefined)stable.add(chord.bass)
    if(stable.has(pc(e.notes[0])))continue
    const ceiling=Math.min(Math.max(60,keyboard.low+11),...right.filter(r=>r.hand==='right'&&
      r.startBeat<e.startBeat+e.durationBeats&&e.startBeat<r.startBeat+r.durationBeats).map(r=>Math.min(...r.notes)-2))
    const targets=result.filter(n=>n.startBeat>e.startBeat&&n.startBeat<=e.startBeat+.5&&stable.has(pc(n.notes[0])))
    const pickup=targets.flatMap(n=>[n.notes[0]-1,n.notes[0]+1])
      .find(n=>pc(n)===pc(e.notes[0])&&n>=keyboard.low&&n<=ceiling)
    const choices=Array.from({length:Math.max(0,ceiling-keyboard.low+1)},(_,i)=>keyboard.low+i).filter(n=>stable.has(pc(n)))
    if(pickup===undefined&&!choices.length)return []
    e.notes=[pickup??choices.reduce((a,b)=>Math.abs(b-e.notes[0])<Math.abs(a-e.notes[0])?b:a)]
  }
  return result
}
export const cpBossaConnections=bossaSections.flatMap(s=>{
  const right=s.events.filter(e=>e.hand==='right'&&(s.vocalPickupAt===null||e.at<s.vocalPickupAt))
  return right.slice(1).map((e,i)=>({
    phase:right[i].at%4, step:e.at-right[i].at,
    previous:i?right[i].at-right[i-1].at:1,
    held:Math.max(...right[i].gates),
    motion:Math.max(...e.tones)-Math.max(...right[i].tones),
  }))
})

// Short rhythmic gestures, never an archived bar/phrase scaffold. Keeping the
// connected durations avoids inventing a new syncopation independently per note.
export const cpBossaRhythmGestures=bossaSections.flatMap(s=>{
  const r=s.events.filter(e=>e.hand==='right'&&!e.parallelMajor&&
    (s.vocalPickupAt===null||e.at<s.vocalPickupAt))
  return r.flatMap((e,i)=>{
    if(e.at%1!==0)return []
    const end=r.findIndex((n,j)=>j>i&&Math.abs(n.at-e.at-2)<.001)
    if(end<=i)return []
    const steps=r.slice(i,end).map((n,j)=>r[i+j+1].at-n.at)
    if(steps.some((n,j)=>n<.249||n>1.5||Math.abs(n*4-Math.round(n*4))>.001||
      Math.max(...r[i+j].gates)<n-.201))return []
    return [{phase:e.at%4,steps}]
  })
})

/** New continuous phrase, not a succession of chord-sized mini-solos.
 * Preserve the native paired-hand form, then voice-lead a new melodic line.
 * Beam search keeps alternative resolutions instead of snapping each note greedily.
 */
function composeBossaLine(options:PhraseSectionOptions, chords:ReturnType<typeof parseChordInput>['chords'],
  starts:number[],range:{low:number;high:number}, length:number, random:()=>number,
  handPlan:Map<number,HandCell>,phrasing:Map<number,string>,plan:BossaPlan):TimelineEvent[] {
  const pick=<T,>(xs:readonly T[])=>xs[Math.floor(random()*xs.length)]
  const key=options.key!
  const modeSources=sources.sections.filter(s=>s.mode===key.scale)
  const motifs=modeSources.flatMap(s=>{
    const r=s.events.filter(e=>e.hand==='right'&&!e.parallelMajor&&(s.vocalPickupAt===null||e.at<s.vocalPickupAt))
    return r.slice(0,-3).flatMap((_,i)=>{
      const group=r.slice(i,i+4)
      const motion=group.slice(1).map((e,j)=>Math.max(...e.tones)-Math.max(...group[j].tones))
      return motion.some(n=>n!==0)&&motion.every(n=>Math.abs(n)<=7)&&
        group.slice(1).every((e,j)=>e.at-group[j].at<=1.5)?[{motion,id:s.id}]:[]
    })
  })
  const slots:Array<{at:number;span:number;run:boolean;breath:boolean;motion:number;stamp?:boolean;gate?:number;voices?:number;gates?:number[]}>=[]
  const shapes=cpRunShapes.filter(s=>s.mode===key.scale)
  const used=new Set<string>()
  // A recurrent interval idea and its answer are learned from same-mode CP
  // sheets; the rhythm source no longer dictates the new melody's contour.
  const theme=pick(motifs.filter(m=>!m.id.startsWith('nguoihayquenemdi:')))
  plan.forEach(({source,from:sourceStart,job},block)=>{
    const start=block*8,end=start+8
    const right=source.events.filter(e=>e.hand==='right'&&e.at>=sourceStart&&e.at<sourceStart+8)
    // Keep paired hands, pickup timing and ties together. New notes replace vocal
    // pickups too; no sung melody is copied into the approach to the next section.
    for(let half=0;half<2;half++){
      const sourceAt=sourceStart+half*4
      const events=source.events.filter(e=>e.at>=sourceAt&&e.at<sourceAt+4)
      const cell:HandCell={id:source.id+':hands:'+sourceAt,genre:'bossa',mode:source.mode,kind:source.kind,
        position:sourceAt/source.lengthBeats,carryBeats:0,
        right:events.filter(e=>e.hand==='right').map(e=>e.at-sourceAt),
        events:events.map(e=>({...e,at:e.at-sourceAt,harmony:source.harmony.findLast(h=>h.at<=e.at)!}))}
      handPlan.set(start+half*4,cell)
      phrasing.set(start+half*4,'bossa-plan:'+job+';theme:'+theme.id)
    }
    const first=slots.length
    right.forEach((e,i)=>{
      const at=start+e.at-sourceStart
      const gates=e.gates.map(g=>Math.min(length-at,g*(e.articulations.includes('staccato')?.5:1)))
      const gate=gates.at(-1)!
      const span=(right[i+1]?start+right[i+1].at-sourceStart:end)-at
      slots.push({at,span,gate,run:e.tones.length===1&&span<=.501,breath:false,
        motion:theme.motion[i%theme.motion.length]*(job==='contrast'?-1:1),
        voices:e.tones.length,stamp:e.tones.length>=3,gates})
    })
    // Borrow only interval contours, fitted to an ALREADY EXISTING Bossa run.
    // Never let a donor's note count, onset spacing or bass replace that window.
    for(let i=first;i<slots.length;){
      if(!slots[i].run){i++;continue}
      let stop=i+1
      while(stop<slots.length&&slots[stop].run&&slots[stop].at-slots[stop-1].at<=.501)stop++
      const count=stop-i
      if(count>=4){
        const fitting=shapes.filter(s=>s.motion.length<count&&!used.has(s.motion.join(',')))
        const longest=Math.max(0,...fitting.map(s=>s.motion.length))
        const pool=fitting.filter(s=>s.motion.length===longest)
        if(pool.length){
          const shape=pick(pool);used.add(shape.motion.join(','))
          for(let j=1;j<=shape.motion.length;j++)slots[i+j].motion=shape.motion[j-1]
          const bar=Math.floor(slots[i].at/4)*4
          phrasing.set(bar,phrasing.get(bar)!+';contour:'+shape.family+':'+shape.id)
        }
      }
      i=stop
    }
  })
  // A modest native subdivision variation, only a held SINGLE melody note.
  // Same endpoints, same bass, same accents; never erase a rest or staccato punch.
  const ornaments=slots.filter(s=>s.voices===1&&s.span===.5&&s.gate===.5&&s.at%1===0&&
    s.at<length-8&&slots.some(n=>Math.abs(n.at-s.at-.5)<.001))
  if(ornaments.length&&random()<.7){
    const s=pick(ornaments),i=slots.indexOf(s)
    s.span=.25;s.gate=.25;s.gates=[.25];s.run=true
    slots.splice(i+1,0,{...s,at:s.at+.25,motion:-Math.sign(s.motion||1)})
  }
  // Detection accepts both sevenths in minor; composition must not treat the
  // raised seventh as a free note over i7 / VII. Add it only through local harmony.
  const scale=new Set(degreesOf(key.scale).map(d=>pc(key.tonic+d.semitones)))
  const chordType=(intervals:readonly number[])=>intervals.includes(6)?'diminished':
    intervals.includes(3)?'minor':intervals.includes(10)?'dominant':'major'
  // Learn note choices relative to each LOCAL chord, not just membership in a key.
  const colors=modeSources.flatMap(s=>s.events.flatMap(e=>{
    const h=s.harmony.findLast(h=>h.at<=e.at)
    if(e.hand!=='right'||e.parallelMajor||!h||Math.max(...e.gates)<.5||
      s.vocalPickupAt!==null&&e.at>=s.vocalPickupAt)return []
    const c=parseChordInput('C'+h.suffix).chords[0]
    return c?[{type:chordType(c.quality.intervals),tone:pc(Math.max(...e.tones)-h.root)}]:[]
  }))
  // Same-mode, same-harmony melodic transitions: learn HOW a color is approached
  // and left, not just how often that pitch occurs. No major evidence in minor.
  const melodicLinks=modeSources.flatMap(s=>{
    const r=s.events.filter(e=>e.hand==='right'&&!e.parallelMajor&&
      (s.vocalPickupAt===null||e.at<s.vocalPickupAt))
    return r.slice(1).flatMap((e,i)=>{
      const h=s.harmony.findLast(h=>h.at<=e.at),before=r[i]
      if(!h||before.at<h.at||e.at-before.at>1.5)return []
      const c=parseChordInput('C'+h.suffix).chords[0]
      return c?[{type:chordType(c.quality.intervals),
        from:pc(Math.max(...before.tones)-h.root),to:pc(Math.max(...e.tones)-h.root),
        direction:Math.sign(Math.max(...e.tones)-Math.max(...before.tones))}]:[]
    })
  })
  const pcs=chords.map(c=>{
    const stable=new Set(c.quality.intervals.map(n=>pc(c.root+n)))
    const allowed=new Set([...scale,...stable])
    if(c.quality.intervals.includes(3))allowed.delete(pc(c.root+4))
    else if(c.quality.intervals.includes(4))allowed.delete(pc(c.root+3))
    const contextual=cpMelodicContexts.filter(n=>n.mode===key.scale&&
      n.root===pc(c.root-key.tonic)&&n.type===chordType(c.quality.intervals))
    const native=contextual.filter(n=>n.genre==='bossa nova')
    // Minor Bossa learns its native local function first. Other minor sheets
    // supply missing functions, not a vote that outnumbers the sole Bossa sheet.
    const pool=key.scale==='minor'?(native.length?native:contextual):[]
    const observed=pool.length?pool.filter(n=>n.held).map(n=>pc(c.root+n.tone)):
      colors.filter(n=>n.type===chordType(c.quality.intervals)).map(n=>pc(c.root+n.tone))
    const landing=new Set([...stable,...observed.filter(n=>allowed.has(n)&&
      (key.scale==='minor'&&native.some(e=>e.held&&e.tone===pc(n-c.root))||
        !c.quality.intervals.slice(0,3).some(step=>pc(n-c.root-step)===1)))])
    const links=pool.length?pool.filter(n=>n.from!==null).map(n=>({from:n.from!,to:n.tone,direction:n.direction})):
      melodicLinks.filter(n=>n.type===chordType(c.quality.intervals))
    return {stable,allowed,landing,observed,links}
  })
  const pitches=Array.from({length:range.high-range.low+1},(_,i)=>range.low+i)
  const candidates=slots.map(s=>{
    const i=chordIndexAt(starts,s.at)
    const strong=s.at%4===0||s.at%4===2||(s.gate??s.span)>=.5
    let allowed=new Set(s.stamp?pcs[i].stable:strong?pcs[i].landing:pcs[i].allowed)
    for(let j=i+1;j<starts.length&&starts[j]<s.at+(s.gate??s.span)-.001;j++){
      const common=new Set([...allowed].filter(n=>pcs[j].stable.has(n)))
      if(common.size)allowed=common
      else {s.gate=starts[j]-s.at;break}
    }
    const available=pitches.filter(n=>allowed.has(pc(n)))
    const voiced=available.filter(n=>!s.stamp||n>=range.low+6)
    return voiced.length?voiced:available
  })
  type Path={cost:number;notes:number[]}
  // Reserve reachable guide tones before committing to an earlier cheap motif.
  // Especially important when a tie has only one common pitch on a small keyboard.
  for(let i=candidates.length-2;i>=0;i--)
    candidates[i]=candidates[i].filter(n=>candidates[i+1].some(next=>Math.abs(next-n)<=(slots[i+1].run?12:9)))
  let paths:Path[]=[{cost:0,notes:[]}]
  for(let i=0;i<slots.length;i++){
    const s=slots[i],group=Math.floor(s.at/8)
    const center=range.low+(range.high-range.low)*(.35+.25*Math.sin(Math.PI*s.at/length))
    const next=pcs[Math.min(chords.length-1,chordIndexAt(starts,s.at)+1)].stable
    const approaching=s.at%4>=3
    const expanded:Path[]=[]
    for(const path of paths) for(const n of candidates[i]){
      const last=path.notes.at(-1),before=path.notes.at(-2),third=path.notes.at(-3)
      const delta=last===undefined?0:n-last
      if(last!==undefined&&(Math.abs(delta)>(s.run?12:9)||!s.stamp&&n===last&&last===before))continue
      if(!s.stamp&&before===n&&third===last)continue // repeated chord punches are intentional
      const desired=s.motion+(!s.run&&group>1&&i%5===0?(group%2?2:-2):0)
      const leap=before===undefined||last===undefined?0:last-before
      // In 27 native minor Bossa fast triples, no two consecutive fourth-or-
      // larger leaps. Ballad octave weaving is not portable just by retiming it.
      // Keep single skips, thirds, turns, punches and all onsets; reconnect the run.
      const fastLine=i>=2&&s.at-slots[i-1].at<=.501&&slots[i-1].at-slots[i-2].at<=.501&&
        [s,slots[i-1],slots[i-2]].every(slot=>(slot.voices??1)<=2)&&
        chordIndexAt(starts,slots[i-2].at)===chordIndexAt(starts,s.at)
      if(key.scale==='minor'&&fastLine&&Math.abs(leap)>=5&&Math.abs(delta)>=5)continue
      const recover=!s.run&&Math.abs(leap)>=5&&Math.sign(delta)===Math.sign(leap)?5:0
      const ending=i===slots.length-1
      const chord=chords[chordIndexAt(starts,s.at)]
      const local=pcs[chordIndexAt(starts,s.at)]
      const frequency=local.observed.filter(t=>t===pc(n)).length/Math.max(1,local.observed.length)
      const links=last===undefined?[]:local.links.filter(l=>l.from===pc(last-chord.root))
      const learned=links.filter(l=>l.to===pc(n-chord.root)&&l.direction===Math.sign(delta)).length/Math.max(1,links.length)
      const previousLocal=i?pcs[chordIndexAt(starts,slots[i-1].at)]:local
      const unresolved=last!==undefined&&!previousLocal.landing.has(pc(last))&&
        (Math.abs(delta)>2||!local.landing.has(pc(n)))?4:0
      const targetPc=options.kind==='outro'?key.tonic:pc((options.opening?.root??key.tonic)-1)
      const cost=path.cost+Math.abs(delta-desired)*(s.run?1.1:.5)+Math.max(0,Math.abs(delta)-(s.run?7:4))*.9+
        (delta===0?(s.stamp?.3:3):0)+recover+Math.abs(n-center)*.14+
        (approaching&&!next.has(pc(n))?1:0)+(ending&&pc(n)!==targetPc?6:0)+
        unresolved-Math.min(1.5,frequency*5)-Math.min(2,learned*6)
      expanded.push({cost,notes:[...path.notes,n]})
    }
    expanded.sort((a,b)=>a.cost-b.cost)
    // Keep different last-two-note states so a cheap repeated motif cannot monopolize the beam.
    const seen=new Set<string>()
    paths=expanded.filter(p=>{const id=p.notes.slice(-2).join(',');if(seen.has(id))return false;seen.add(id);return true}).slice(0,12)
    if(!paths.length) return [] // Never bypass harmonic/range constraints.
  }
  const line=paths[0].notes, events:TimelineEvent[]=[]
  slots.forEach((s,i)=>{
    const top=line[i],bar=chordIndexAt(starts,s.at),notes=[top]
    const lastBar=chordIndexAt(starts,s.at+(s.gate??s.span)-.001)
    const count=Math.min(4,s.voices??1)
    while(notes.length<count){
      const lower=pitches.filter(n=>n<=notes[0]-2&&n>=top-12&&pcs[bar].stable.has(pc(n))&&pcs[lastBar].stable.has(pc(n)))
      if(!lower.length)break
      notes.unshift(lower.reduce((a,b)=>Math.abs(a-notes[0]+3)<Math.abs(b-notes[0]+3)?a:b))
    }
    const grouped=new Map<number,number[]>()
    notes.forEach((n,j)=>{
      let gate=j===notes.length-1?s.gate??s.span:s.gates?.[j]??s.gate??s.span
      for(let k=bar+1;k<starts.length&&starts[k]<s.at+gate-.001;k++)
        if(!pcs[k].stable.has(pc(n))){gate=starts[k]-s.at;break}
      grouped.set(gate,[...grouped.get(gate)??[],n])
    })
    for(const [durationBeats,voicing] of grouped)events.push({hand:'right',notes:voicing,startBeat:s.at,durationBeats,
      velocity:s.stamp?82:s.run?66:s.at%1===0?75:70})
  })
  // Chromatic pickup must resolve by semitone; put it only in a short weak run
  // slot whose preceding leap stays playable. Never distort an entire run to add it.
  for(let i=1;i<events.length-1;i++){
    const e=events[i],next=events[i+1],before=events[i-1]
    const slot=slots.find(s=>s.at===e.startBeat)
    if(!slot?.run||e.notes.length!==1||e.startBeat%1===0||e.durationBeats>.34||
      key.scale!=='minor'&&i%7!==3)continue
    const n=next.notes.at(-1)!-1
    const bar=chordIndexAt(starts,e.startBeat)
    if(chordIndexAt(starts,next.startBeat)!==bar || !pcs[bar].stable.has(pc(next.notes.at(-1)!)) ||
      Math.abs(n-before.notes.at(-1)!)>(key.scale==='minor'?4:2))continue
    if(key.scale==='minor'&&!cpHasApproach(chords[bar],key,before.notes.at(-1)!,n,next.notes.at(-1)!))continue
    const local=events.slice(Math.max(0,i-3),i+4).map((event,j)=>Math.max(0,i-3)+j===i?n:event.notes.at(-1)!)
    const loops=local.some((p,j)=>j>=2&&p===local[j-1]&&p===local[j-2] ||
      j>=3&&p===local[j-2]&&local[j-1]===local[j-3])
    if(!loops&&n>=range.low&&n<=range.high&&Math.abs(n-before.notes.at(-1)!)<=7)e.notes=[n]
  }
  return events
}

/** Bossa: plan new statements/contrasts/lead-ins using local joint-hand gestures.
 * Other genres retain their own planner; cross-genre learning never imports timing.
 */
export function composeCpSolo(options: PhraseSectionOptions): PhraseSection {
  const empty = (why: string): PhraseSection => ({events:[],chords:[],beatsEach:[],lengthBeats:0,unavailableReason:why})
  const key=options.key, genre=cpGenre(options.style)
  if(!key || !['major','minor'].includes(key.scale)) return empty('CP cần xác định giọng trưởng hoặc thứ.')
  if(options.style.beatsPerMeasure!==4 || (options.style.gridUnit??1)!==1 || !['bossa','ballad'].includes(genre??''))
    return empty('Chưa có quy tắc solo CP tương thích điệu/nhịp này; không ép câu khác nhịp.')
  const keyboard=options.caPhaoKeyboardRange??{low:36,high:96}
  // Leave a complete bass octave plus a whole-tone separation on small keyboards.
  const requested=options.caPhaoFull ? {low:keyboard.low+14,high:keyboard.high} : options.range??{low:60,high:84}
  const range={low:Math.max(keyboard.low+14,requested.low),high:Math.min(keyboard.high,requested.high)}
  if(![keyboard.low,keyboard.high,range.low,range.high].every(Number.isInteger) ||
    keyboard.low<0 || keyboard.high>127 || keyboard.high-keyboard.low<24 || range.high-range.low<12)
    return empty('Tầm đàn CP không hợp lệ; tay phải cần ít nhất một quãng tám trong tầm đàn.')
  const take=Number.isFinite(options.take)?Math.abs(Math.trunc(options.take!)):0
  let seed=(take+1)*7919+key.tonic*101+options.kind.length*47
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  const pick=<T,>(xs:readonly T[]):T=>xs[Math.floor(random()*xs.length)]
  const minor=key.scale==='minor'
  const native=cpSoloCells.filter(c=>c.genre===genre)
  const melodic=cpSoloCells.filter(c=>c.mode===key.scale && (c.genre===genre || c.genre==='ballad'))
  if(!native.length || !melodic.length) return empty('Chưa đủ kỹ thuật có nguồn đúng màu giọng để soạn.')
  // Stable length between passes, without retaining an archived section order.
  const lengths=sources.sections.filter(s=>(s.genre==='bossa nova'?'bossa':s.genre)===genre &&
    s.kind===options.kind && (s.mode===key.scale || genre==='bossa')).map(s=>s.lengthBeats)
  const bars=genre==='bossa'?(options.caPhaoFull?(options.kind==='outro'?6:8):options.kind==='interlude'?6:4):options.caPhaoFull ? Math.max(8,Math.ceil(Math.max(...lengths)/8)*2)
    : options.kind==='interlude'?6:4
  const lengthBeats=bars*4
  const roles:Role[]=Array.from({length:bars},(_,i)=>i>=bars-2?'cadence':
    i===0?'question':i===1?'answer':i===bars-3?'recall':pick(['develop','run','answer'] as const))
  // One recurrent motif is authored from observed interval classes. No contour is copied.
  const intervalBag=melodic.flatMap(c=>c.phrase.notes.slice(1).map((n,i)=>{
    const delta=n.tones.at(-1)!-c.phrase.notes[i].tones.at(-1)!
    return Math.sign(delta)*Math.min(3,Math.max(1,Math.round(Math.abs(delta)/2)))
  })).filter(n=>n!==0)
  const motif=[0,...Array.from({length:4},()=>pick(intervalBag))]
  const scale=new Set(degreesOf(key.scale).map(d=>pc(key.tonic+d.semitones)))
  const scaleNotes=Array.from({length:range.high-range.low+1},(_,i)=>range.low+i).filter(n=>scale.has(pc(n)))
  // Observed harmonic transitions, reduced to functions, with mode-safe qualities.
  const degreeSet=new Set(minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9])
  const observed=sources.sections.filter(s=>s.mode===key.scale && (s.genre==='ballad' ||
    (s.genre==='bossa nova'?'bossa':s.genre)===genre))
  const successors=(root:number)=>observed.flatMap(s=>s.harmony.slice(1).flatMap((h,i)=>
    s.harmony[i].root===root && h.root!==root && degreeSet.has(h.root)?[h.root]:[]))
  const suffixFor=(degree:number)=>{
    if(minor && degree===2) return 'm7b5'
    const isMinor=minor?[0,5,7].includes(degree):[2,4,9].includes(degree)
    const choices=cpHarmonyCells.filter(c=>c.mode===key.scale).flatMap(c=>c.harmony)
      .filter(h=>h.root===degree).map(h=>h.suffix).filter(s=>{
        const chord=parseChordInput('C'+s).chords[0]
        return chord && chord.quality.intervals.every(n=>scale.has(pc(key.tonic+degree+n))) &&
          (genre!=='bossa'||chord.quality.intervals.length>=4) &&
          chord.quality.intervals.includes(3)===isMinor &&
          (isMinor || chord.quality.intervals.includes(4))
      })
    // i/iv in the Bossa source speak in m9/m11. Do not flatten these to the
    // much more frequent Ballad m7. Keep the SAME random draw so phrasing stays put.
    const draw=choices.length?random():0
    const nativeColors=genre==='bossa'&&minor&&[0,5].includes(degree)?
      bossaSections.flatMap(s=>s.harmony).filter(h=>h.root===degree&&['m9','m11'].includes(h.suffix))
        .map(h=>h.suffix):[]
    const palette=nativeColors.length?nativeColors:choices
    return palette.length?palette[Math.floor(draw*palette.length)]:isMinor?'m7':'maj7'
  }
  let degree=0
  const harmony:Array<{at:number;symbol:string}>=[]
  for(let bar=0;bar<bars-2;bar++){
    if(bar) degree=pick(successors(degree).length?successors(degree):[minor?5:2,7,0])
    harmony.push({at:bar*4,symbol:pitchClassName(pc(key.tonic+degree))+suffixFor(degree)})
  }
  const tonicSymbol=pitchClassName(key.tonic)+(minor?'m9':'maj9')
  const target=options.kind==='outro'?parseChordInput(tonicSymbol).chords[0]:
    options.opening??parseChordInput(tonicSymbol).chords[0]
  if(options.kind==='outro'){
    harmony.push({at:lengthBeats-8,symbol:pitchClassName(pc(key.tonic+7))+(take%2?'7b13':'7')},
      {at:lengthBeats-4,symbol:tonicSymbol})
  } else {
    harmony.push({at:lengthBeats-8,symbol:pitchClassName(pc(target.root+2))+
      (target.quality.intervals.includes(3)?'m7b5':'m7')},
      {at:lengthBeats-4,symbol:pitchClassName(pc(target.root+7))+(take%2?'11':'7')})
  }
  const handPlan=new Map<number,HandCell>()
  const phrasing=new Map<number,string>()
  const bossaPlan=genre==='bossa'?planBossa(options.kind,bars/2,random):[]
  if(genre==='bossa'){
    if(options.kind!=='outro'){
      const pre=pick([2,5])
      harmony[harmony.length-2].symbol=pitchClassName(pc(target.root+pre))+
        (pre===2?(target.quality.intervals.includes(3)?'m7b5':'m7'):
          target.quality.intervals.includes(3)?'m9':'maj9')
      // Decide the real destination BEFORE resolving an earlier bII -> V into it.
      // No source sung pickup pitches or early tonic before the singer enters.
      harmony[harmony.length-1].at=lengthBeats-pick([4,2.5,2])
    }
    // The harmonic route above is newly composed from same-mode transitions.
    // Only a technique whose identity REQUIRES bII -> V reserves that local pair.
    bossaPlan.forEach((g,block)=>{
      if(g.source.kind!=='outro'||g.from!==0)return
      const at=block*8+4
      const nextRoot=block*8+8<lengthBeats?parseChordInput(harmony.find(h=>h.at===block*8+8)!.symbol).chords[0].root:key.tonic
      harmony.splice(harmony.findIndex(h=>h.at===at),1,
        {at,symbol:pitchClassName(pc(nextRoot+1))+'9'},
        {at:at+2,symbol:pitchClassName(pc(nextRoot+7))+(minor?'7b13':'13')})
    })
  }
  const starts=harmony.map(h=>h.at)
  const beatsEach=starts.map((at,i)=>(starts[i+1]??lengthBeats)-at)
  const chords=harmony.map(h=>({...parseChordInput(h.symbol).chords[0],voicingStyle:'ca-phao' as const}))
  const events:TimelineEvent[]=[]
  const traces:NonNullable<PhraseSection['compositionSources']>=[]
  let previous=scaleNotes[Math.floor(scaleNotes.length*.4)]
  const nearest=(wanted:number,allowed:readonly number[])=>allowed.reduce((a,b)=>Math.abs(b-wanted)<Math.abs(a-wanted)?b:a)
  // Target-genre subdivision distribution; no Ballad onset array can enter Bossa.
  const rhythmSteps=native.flatMap(c=>c.phrase.notes.slice(1).map((n,i)=>n.at-c.phrase.notes[i].at))
    .filter(n=>[.25,.5,1].includes(n))
  if(genre==='bossa'){
    const line=composeBossaLine(options,chords,starts,range,lengthBeats,random,handPlan,phrasing,bossaPlan)
    if(!line.length)return empty('Chưa tìm được câu Bossa nối liên tục đúng tầm/giọng; không phát câu lỗi.')
    events.push(...line)
    for(let bar=0;bar<bars;bar++)traces.push({bar:bar+1,start:bar*4,end:bar*4+4,
      harmony:'learned-functional-transitions',melody:'continuous-motif-voice-leading',
      rhythm:'bossa-local-rhythm-transitions',donorGenre:'bossa',mode:key.scale,sourceKind:options.kind})
  }
  for(let bar=0;genre!=='bossa'&&bar<bars;bar++){
    const role=roles[bar], chord=chords[bar], start=bar*4
    const stablePc=new Set(chord.quality.intervals.map(n=>pc(chord.root+n)))
    const stable=Array.from({length:range.high-range.low+1},(_,i)=>range.low+i).filter(n=>stablePc.has(pc(n)))
    const allowed=new Set([...scale,...stablePc])
    if(chord.quality.intervals.includes(3)) allowed.delete(pc(chord.root+4))
    else if(chord.quality.intervals.includes(4)) allowed.delete(pc(chord.root+3))
    const palette=Array.from({length:range.high-range.low+1},(_,i)=>range.low+i).filter(n=>allowed.has(pc(n)))
    const donor=pick(melodic) // evidence only: no donor notes/times are placed
    const paired=donor.phrase.notes.filter(n=>n.tones.length>1).length/donor.phrase.notes.length
    const run=role==='run'||(role==='cadence'&&bar===bars-2)
    const final=bar===bars-1
    const stop=final&&options.kind==='outro'?1:role==='answer'||role==='recall'?3:3.5
    let at=role==='answer'&&genre==='bossa'?.5:0, point=0
    let direction=role==='answer'?-1:1
    while(at<stop){
      const step=final&&options.kind==='outro'?4:
        run?(options.caPhaoFull?.25:.5):Math.max(.5,pick(rhythmSteps))
      const strong=at%1===0, landing=at+step>=stop
      const index=palette.indexOf(nearest(previous,palette))
      if(run && (index>=palette.length-2 || index<=1)) direction=index<=1?1:-1
      const motion=run?direction*(point%4===0?2:1):motif[point%motif.length]*(role==='answer'?-1:1)
      const wanted=palette[Math.max(0,Math.min(palette.length-1,index+motion))]
      const top=nearest(wanted,strong||landing?stable:palette)
      const notes=[top]
      if(!run && (point===0 || random()<paired*.5)){
        const lower=palette.filter(n=>n<=top-3&&n>=top-9)
        if(lower.length) notes.unshift(nearest(top-4,lower))
      }
      const duration=Math.min(step,4-at)*(landing&&!final?.82:.94)
      // Resolved chromatic approach is a separate weak pickup, never an unlicensed mode change.
      if(run && point===2 && at>=.5 && top-1>=range.low){
        const prior=events.at(-1)!
        const pickup=start+at-.25
        if(prior.startBeat < pickup){
          prior.durationBeats=Math.min(prior.durationBeats,pickup-prior.startBeat)
          events.push({hand:'right',notes:[top-1],startBeat:pickup,durationBeats:.23,velocity:58})
        } else prior.notes=[top-1]
      }
      events.push({hand:'right',notes,startBeat:start+at,durationBeats:duration,velocity:strong?74:66})
      previous=top;at+=step;point++
    }
    traces.push({bar:bar+1,start,end:start+4,harmony:'learned-functional-transitions',
      melody:role+':interval-distribution',rhythm:genre+':subdivision-distribution',
      donorGenre:donor.genre,mode:key.scale,sourceKind:donor.kind})
  }
  // Solo LH is no longer the sung accompaniment loop. Select native hand gestures
  // by the relationship to the composed RH (together / answer / held bass under run).
  const leftPool=cpHandCells.filter(c=>c.genre===genre&&(genre==='bossa'||c.mode===key.scale))
  let upperAnswerUsed=false
  for(let start=0;start<lengthBeats;start+=4){
    const right=events.filter(e=>e.hand==='right'&&e.startBeat>=start&&e.startBeat<start+4)
    let cell=handPlan.get(start)
    if(!cell){
      const relation=(leftAt:number,rightAt:number[])=>Math.min(2,...rightAt.map(at=>Math.abs(at-leftAt)))
      const ranked=leftPool.map(c=>({cell:c,score:
        Math.abs(c.right.length-right.length)*.2+(c.kind===options.kind?0:.3)+
        c.events.filter(e=>e.hand==='left').reduce((cost,e)=>cost+
          Math.abs(relation(e.at,c.right)-relation(e.at,right.map(r=>r.startBeat-start))),0)+random()*.4}))
        .sort((a,b)=>a.score-b.score)
      cell=ranked[0]?.cell
    }
    if(!cell)return empty('Chưa có mẫu phối hợp hai tay cùng điệu.')
    const left=composeLeftHand(cell,start,chords,starts,events,keyboard,lengthBeats)
    if(!left.length&&cell.events.some(e=>e.hand==='left'))return empty('Không đủ tầm đàn cho phối hợp hai tay solo.')
    // No fresh downbeat bass does not necessarily mean silence: preserve a
    // compatible held note into a source's tied entrance, without retriggering.
    if(cell.carryBeats>0&&!left.some(e=>e.startBeat===start)){
      const end=Math.min(start+cell.carryBeats,...left.map(e=>e.startBeat),start+4)
      const chord=chords[chordIndexAt(starts,start)]
      for(const held of events.filter(e=>e.hand==='left'&&e.startBeat<start&&Math.abs(e.startBeat+e.durationBeats-start)<.001)){
        if(held.notes.every(n=>chord.quality.intervals.some(i=>pc(chord.root+i)===pc(n)))&&
          right.filter(r=>r.startBeat<end&&r.startBeat+r.durationBeats>start).every(r=>Math.max(...held.notes)<=Math.min(...r.notes)-2))
          held.durationBeats=end-held.startBeat
      }
    }
    // Measured intro beat 9.5: LH b3 may answer just ABOVE an RH ninth.
    // Keep the bass below; one brief inner-voice exception, never an entire raised bass chord.
    if(genre==='bossa'&&minor&&options.kind==='intro'&&cell.id==='nguoihayquenemdi:intro:hands:8'&&
      !upperAnswerUsed){
      const chord=chords[chordIndexAt(starts,start+1.5)]
      const r=right.find(e=>e.notes.length===1&&e.startBeat<=start+1.5&&e.startBeat+e.durationBeats>=start+2)
      const answer=left.find(e=>e.startBeat===start+1.5&&pc(e.notes[0]-chord.root)===3)
      if(chord.quality.intervals.includes(3)&&r&&pc(r.notes[0]-chord.root)===2&&answer&&r.notes[0]+1<=keyboard.high){
        answer.notes=[r.notes[0]+1];answer.durationBeats=Math.min(.5,answer.durationBeats)
        upperAnswerUsed=true
      }
    }
    events.push(...left)
    traces[start/4].rhythm=cell.id
    if(phrasing.has(start))traces[start/4].melody=phrasing.get(start)!
  }
  return {events:events.sort((a,b)=>a.startBeat-b.startBeat),lengthBeats,
    chords:harmony.map(h=>h.symbol),beatsEach,
    sourcePhrase:{id:'cp-original',fromBar:1,barCount:bars,method:'cp-composition'},
    compositionSources:traces,
    adaptationNote:genre==='bossa'?'Soạn mới bố cục, vòng và giai điệu CP; phối tay/nhấn/nghỉ dùng thủ pháp Bossa, nguồn cùng giọng bổ sung mô-típ và đường chạy. Dạo/giang dẫn vào hợp âm phần kế. Không đổi khung đệm hát.':
      'Soạn mới theo nguồn cùng điệu; phối hợp hai tay và dẫn/kết. Khung đệm hát không đổi.'}
}
