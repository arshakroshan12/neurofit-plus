/**
 * Structured workout data organized by focus area and fatigue level.
 * Mapped from backend workout_library.json with custom organization for chatbot.
 */

import { STEP_VIDEO_MAP } from "./stepVideoMap"

export type FocusArea = "arms" | "chest" | "legs" | "core" | "full_body"
export type FatigueLevel = "low" | "moderate" | "high"

export interface Workout {
  id: string
  title: string
  description: string
  duration_min: number
  intensity: "easy" | "medium" | "hard"
  focusAreas: FocusArea[]
  steps: string[]
  mediaUrl?: string
}

type WorkoutsByFatigue = {
  [key in FatigueLevel]: Workout[]
}

type WorkoutsByArea = {
  [key in FocusArea]: WorkoutsByFatigue
}

export const WORKOUT_LIBRARY: WorkoutsByArea = {
  arms: {
    low: [
      {
        id: "arms_low_1",
        mediaUrl: "https://pixabay.com/get/gc1aa86f0faaa7963260fd2a9a8a7b5bcd215e094173d830c67cb5530b94c3912ab8f9a94fd1d68c9b96bbef65111cc466d5b94117538d559aa9361701e17d81c_640.jpg",
        title: "Upper-Body Sculpt",
        description:
          "Focused arm workout with controlled movements targeting triceps and biceps.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["arms"],
        steps: [
          "Push-ups – 45 seconds",
          "Tricep dips using chair – 45 seconds",
          "Arm circles – 1 minute",
          "Plank shoulder taps – 45 seconds",
          "Rest 1 minute and repeat twice",
        ],
      },
      {
        id: "arms_low_2",
        mediaUrl: "https://pixabay.com/get/g43c41f489d852c03ce753a33be377e4b395268e6fc34ef8384cf252771cd52b053cc5f18f9b873bd05b03bd642138ae50e1e2b20452d7fc6724e5f9ff7c08eab_640.jpg",
        title: "Full-Body Functional Workout",
        description:
          "High-intensity workout including significant arm engagement through compound movements.",
        duration_min: 22,
        intensity: "hard",
        focusAreas: ["arms", "full_body"],
        steps: [
          "Burpees – 30 seconds",
          "Squat jumps – 30 seconds",
          "Push-ups – 45 seconds",
          "Plank – 1 minute",
          "Rest – 45 seconds, repeat twice",
        ],
      },
    ],
    moderate: [
      {
        id: "arms_moderate_1",
        mediaUrl: "https://pixabay.com/get/g63eb20cc19bf66da88b944b41eec8b8688bc9da583cfda438f785aca3ffeb0f2195ee9e4eee64175019a8c71d50d21dc6366f5e5bf06b89d6d91643d65b75ea3_640.jpg",
        title: "Upper-Body Sculpt",
        description:
          "Controlled arm workout with adequate rest periods. Suitable for moderate fatigue.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["arms"],
        steps: [
          "Push-ups – 45 seconds",
          "Tricep dips using chair – 45 seconds",
          "Arm circles – 1 minute",
          "Plank shoulder taps – 45 seconds",
          "Rest 1 minute and repeat twice",
        ],
      },
      {
        id: "arms_moderate_2",
        mediaUrl: "https://pixabay.com/get/g3341729bd8cb88b684b134dd4905789930e1a7553fbcb92f2a586bd9bfca307e49f074c05f96f3287d8dbc3cfcd36e81f9b8159bdb5d6a0e63eb49ebe303d532_640.jpg",
        title: "Strength & Stability Mix",
        description:
          "Balanced workout incorporating arms with adequate recovery time.",
        duration_min: 20,
        intensity: "medium",
        focusAreas: ["arms", "core"],
        steps: [
          "Lunges – 45 seconds each leg",
          "Push-ups – 45 seconds",
          "Side plank – 30 seconds each side",
          "Bird-dog – 1 minute",
          "Repeat sequence twice with 1 minute rest between",
        ],
      },
    ],
    high: [
      {
        id: "arms_high_1",
        mediaUrl: "https://pixabay.com/get/g92fba28b1a1931a085b22ffb1601b4839c8e6232337f20bf9f3d178b81848ab9f67b129c57b87258547945bfe696454458ca7734d361e499fbe3228a9932d3e2_640.jpg",
        title: "Gentle Stretching Routine",
        description:
          "Low-intensity recovery focusing on arm and upper body stretching.",
        duration_min: 10,
        intensity: "easy",
        focusAreas: ["arms"],
        steps: [
          "Neck stretch – 30 seconds",
          "Chest opener – 1 minute",
          "Shoulder rolls – 30 seconds",
          "Arm circles (slow) – 1 minute",
          "Child's pose – 2 minutes",
        ],
      },
      {
        id: "arms_high_2",
        mediaUrl: "https://pixabay.com/get/g97f78e8e7e5b124f5fb6d7dbcd4a2cb7e23805a7d1d76f28d51afdef248fb4d7a75f5642d035fd106160e858c89f0dbd9ed9ab0e5a864616a9f3260c21b7f64b_640.jpg",
        title: "Recovery Yoga Flow",
        description:
          "Restorative yoga focusing on upper body recovery and tension relief.",
        duration_min: 20,
        intensity: "easy",
        focusAreas: ["arms", "full_body"],
        steps: [
          "Cat-cow – 1 minute",
          "Downward dog – 1 minute",
          "Low lunge – 1 minute each side",
          "Seated forward fold – 2 minutes",
          "Supine twist – 1 minute each side",
          "Savasana – 3 minutes",
        ],
      },
    ],
  },

  chest: {
    low: [
      {
        id: "chest_low_1",
        mediaUrl: "https://pixabay.com/get/gb978c7742a732972f8cdbb71264628d752ac0746402a5fb626759bf3b8510022135d6f8b8ca83aff0305aa1478f30807a1dcc960f63d852035455ebda2549b53_640.jpg",
        title: "Upper-Body Sculpt",
        description:
          "Focused chest workout with controlled push-up variations for strength building.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["chest"],
        steps: [
          "Push-ups – 45 seconds",
          "Tricep dips using chair – 45 seconds",
          "Arm circles – 1 minute",
          "Plank shoulder taps – 45 seconds",
          "Rest 1 minute and repeat twice",
        ],
      },
      {
        id: "chest_low_2",
        mediaUrl: "https://pixabay.com/get/gfd724324df6aa314345c38bdfdaaa01a58764f782b9aa2121d4145268379acba1db68cabfaf54be0d8d8e25c13f35432c9890023b28b1db2fdde6393ab619bb2_640.jpg",
        title: "Full-Body Functional Workout",
        description:
          "High-intensity functional workout with chest engagement through burpees and push-ups.",
        duration_min: 22,
        intensity: "hard",
        focusAreas: ["chest", "full_body"],
        steps: [
          "Burpees – 30 seconds",
          "Squat jumps – 30 seconds",
          "Push-ups – 45 seconds",
          "Plank – 1 minute",
          "Rest – 45 seconds, repeat twice",
        ],
      },
    ],
    moderate: [
      {
        id: "chest_moderate_1",
        mediaUrl: "https://pixabay.com/get/gd6782a3f45f6b5cf0d7259e61e79f2077299c74307f5643b4785f2ce1699737fe66a13105792525872573ab4bb0720abec1cb3979f6759d389030e73f6c65e4b_640.jpg",
        title: "Beginner Bodyweight Circuit",
        description:
          "Moderate chest workout with adequate rest for recovery. Includes push-ups and core work.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["chest", "core"],
        steps: [
          "Squats – 45 seconds",
          "Push-ups (knee optional) – 30 seconds",
          "Glute bridge – 45 seconds",
          "Plank – 30 seconds",
          "Rest – 30 seconds, repeat twice",
        ],
      },
      {
        id: "chest_moderate_2",
        mediaUrl: "https://pixabay.com/get/g180aa435e63a591b0fdb0e029245be0c284649b7624656cdb7a74602a1d83f146ff80252540cbf5c974883e326bad08508d197259f7609c6033f264863a60a69_640.jpg",
        title: "Strength & Stability Mix",
        description:
          "Balanced workout with push-up variations and core stability. Good for moderate fatigue.",
        duration_min: 20,
        intensity: "medium",
        focusAreas: ["chest", "core"],
        steps: [
          "Lunges – 45 seconds each leg",
          "Push-ups – 45 seconds",
          "Side plank – 30 seconds each side",
          "Bird-dog – 1 minute",
          "Repeat sequence twice with 1 minute rest between",
        ],
      },
    ],
    high: [
      {
        id: "chest_high_1",
        mediaUrl: "https://pixabay.com/get/gf4236bfd05898b48a38d6c41a1fc085867d2c520fde183b6f8dcec511e8ff10d2e953e3b85b1901251c9b4efd5395b571b5c9634d94a43360f18ea4112d7d5a4_640.jpg",
        title: "Gentle Stretching Routine",
        description:
          "Restorative stretching with focus on chest opener and gentle breathing.",
        duration_min: 10,
        intensity: "easy",
        focusAreas: ["chest"],
        steps: [
          "Chest opener – 1 minute",
          "Neck stretch – 30 seconds",
          "Shoulder rolls – 30 seconds",
          "Cross-arm shoulder stretch – 1 minute each side",
          "Child's pose – 2 minutes",
        ],
      },
      {
        id: "chest_high_2",
        mediaUrl: "https://pixabay.com/get/g72f364f4922f6223f68d9b9c24f1a08775a1f50f233826a07898c7f8033a7df81a4f596342a5e4c79c0d5df4a5c2436476204995d0a14c22225939523b3a7e2e_640.jpg",
        title: "Recovery Yoga Flow",
        description: "Restorative yoga with focus on chest and shoulder opening.",
        duration_min: 20,
        intensity: "easy",
        focusAreas: ["chest", "full_body"],
        steps: [
          "Cat-cow – 1 minute",
          "Downward dog – 1 minute",
          "Low lunge – 1 minute each side",
          "Seated forward fold – 2 minutes",
          "Supine twist – 1 minute each side",
          "Savasana – 3 minutes",
        ],
      },
    ],
  },

  legs: {
    low: [
      {
        id: "legs_low_1",
        mediaUrl: "https://pixabay.com/get/g90acd48580f1472412ea74218ca3fad577a1c163f7263b41d800889b148d878e475a19e33bf5579f0aa9a8f7e99154de432c8d8605286c6d185698f6d7270eea_640.jpg",
        title: "Lower-Body Strength",
        description:
          "High-intensity lower body workout targeting quads, hamstrings, and glutes.",
        duration_min: 18,
        intensity: "medium",
        focusAreas: ["legs"],
        steps: [
          "Squats – 1 minute",
          "Reverse lunges – 1 minute",
          "Calf raises – 1 minute",
          "Wall sit – 45 seconds",
          "Repeat sequence twice with 1 minute rest between",
        ],
      },
      {
        id: "legs_low_2",
        mediaUrl: "https://pixabay.com/get/g86a785f90dcff762fad6694dd6500354e336457e37325479c80fe7d248870d3cd1e56fbceb991e901fa4badf99d039de2d7b27d3d67932bd3f79776600382642_640.jpg",
        title: "Full-Body Functional Workout",
        description:
          "High-energy functional workout with intense leg work through burpees and squat jumps.",
        duration_min: 22,
        intensity: "hard",
        focusAreas: ["legs", "full_body"],
        steps: [
          "Burpees – 30 seconds",
          "Squat jumps – 30 seconds",
          "Push-ups – 45 seconds",
          "Plank – 1 minute",
          "Rest – 45 seconds, repeat twice",
        ],
      },
    ],
    moderate: [
      {
        id: "legs_moderate_1",
        mediaUrl: "https://pixabay.com/get/g15522b58b2f569200fe84e8076519300e4805578b04118224712e7ad04c040dd9529c2dbf3dfdbaecd15ce2ac6edffec3a4516d2f0b543746560905df339c40d_640.jpg",
        title: "Beginner Bodyweight Circuit",
        description:
          "Moderate intensity circuit with leg exercises and adequate recovery time.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["legs", "core"],
        steps: [
          "Squats – 45 seconds",
          "Push-ups (knee optional) – 30 seconds",
          "Glute bridge – 45 seconds",
          "Plank – 30 seconds",
          "Rest – 30 seconds, repeat twice",
        ],
      },
      {
        id: "legs_moderate_2",
        mediaUrl: "https://pixabay.com/get/g755922022e43b2b5dc1137ff26de2ab0f97378a9a2b760f317f9fbd3d8008c4def9058a56d832940fc00a113d3d7d53cbfd3a59e3188653cd3f6dc9a6ea1c33b_640.jpg",
        title: "Lower-Body Strength",
        description:
          "Controlled lower body workout with adequate rest between sets. Perfect for moderate fatigue.",
        duration_min: 18,
        intensity: "medium",
        focusAreas: ["legs"],
        steps: [
          "Squats – 1 minute",
          "Reverse lunges – 1 minute",
          "Calf raises – 1 minute",
          "Wall sit – 45 seconds",
          "Repeat sequence twice with 2 minute rest between",
        ],
      },
    ],
    high: [
      {
        id: "legs_high_1",
        mediaUrl: "https://pixabay.com/get/g89decf0a7e5d6d428f38d6c54b72573cbafe36700ebccc409fb9ba182bbc820788395d027b88b8a29d125dba1d452018ff3a0ca2ff1c2b7284378a32dc71bc14_640.jpg",
        title: "Low-Impact Recovery Circuit",
        description:
          "Gentle leg-focused recovery with minimal impact movements.",
        duration_min: 12,
        intensity: "easy",
        focusAreas: ["legs"],
        steps: [
          "Glute bridge – 1 minute",
          "Standing knee raises – 1 minute",
          "Pelvic tilts – 1 minute",
          "Side-lying leg lifts – 1 minute each side",
        ],
      },
      {
        id: "legs_high_2",
        mediaUrl: "https://pixabay.com/get/g0feeed0ad43556bf668b76c928c722f142b7c4307a7f8d4e0040a1227de2501a94509e8889974d7675f4aeb1084dc4b85032c560681b8bdc53c5cf02beb8a367_640.jpg",
        title: "Standing Cardio Boost",
        description:
          "Very low impact leg movement for light recovery and gentle circulation.",
        duration_min: 12,
        intensity: "easy",
        focusAreas: ["legs"],
        steps: [
          "March in place – 1 minute",
          "Side steps – 1 minute",
          "High knees (low impact) – 30 seconds",
          "Butt kicks – 30 seconds",
          "Repeat sequence two more times",
        ],
      },
    ],
  },

  core: {
    low: [
      {
        id: "core_low_1",
        mediaUrl: "https://pixabay.com/get/g2da07546352ed1facc7e66bb0cef554cfdb5b0dbc9a6e279b7ed29903ec8cc28c415acde7153f7bd433c82858a9c53d1c956ddc26ca73cb93b52fc6c8bb2034_640.jpg",
        title: "Core Strength Builder",
        description:
          "Focused core workout with intense abdominal and stabilizer exercises.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["core"],
        steps: [
          "Crunches – 45 seconds",
          "Bicycle crunch – 30 seconds",
          "Leg raises – 30 seconds",
          "Plank – 1 minute",
          "Rest – 30 seconds, repeat twice",
        ],
      },
      {
        id: "core_low_2",
        mediaUrl: "https://pixabay.com/get/g002ab30c5623e68638129984f9b2a6b19d45aceb9d218e1f3a282c0dccebe01fb670901375c5930cfdb9a1b949966bc01907b5d90c23c9be6096a606a657b7a5_640.jpg",
        title: "Full-Body Functional Workout",
        description:
          "High-intensity full body with significant core engagement throughout.",
        duration_min: 22,
        intensity: "hard",
        focusAreas: ["core", "full_body"],
        steps: [
          "Burpees – 30 seconds",
          "Squat jumps – 30 seconds",
          "Push-ups – 45 seconds",
          "Plank – 1 minute",
          "Rest – 45 seconds, repeat twice",
        ],
      },
    ],
    moderate: [
      {
        id: "core_moderate_1",
        mediaUrl: "https://pixabay.com/get/gb361b92368d7c7827fd4145e6cfe84b20bdd69383b90589d3e81b09ca6d942aff10e258b604bf8a27e1c9c54684c431b699cf148cf26a7a4e1e504de278c148a_640.jpg",
        title: "Core Strength Builder",
        description:
          "Moderate core workout with adequate rest between sets for recovery.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["core"],
        steps: [
          "Crunches – 45 seconds",
          "Bicycle crunch – 30 seconds",
          "Leg raises – 30 seconds",
          "Plank – 1 minute",
          "Rest – 1 minute, repeat twice",
        ],
      },
      {
        id: "core_moderate_2",
        mediaUrl: "https://pixabay.com/get/gd6974107f84eb54e095fd089c6dbe015adc2976adf98cad50ee83135c73305f2ccc4493743e7215e5149065b3f36f320665a714cc2581eb17b284cdfeb14b184_640.jpg",
        title: "Strength & Stability Mix",
        description:
          "Balanced full-body workout with strong core focus and good recovery periods.",
        duration_min: 20,
        intensity: "medium",
        focusAreas: ["core", "full_body"],
        steps: [
          "Lunges – 45 seconds each leg",
          "Push-ups – 45 seconds",
          "Side plank – 30 seconds each side",
          "Bird-dog – 1 minute",
          "Repeat sequence twice with 1 minute rest between",
        ],
      },
    ],
    high: [
      {
        id: "core_high_1",
        mediaUrl: "https://pixabay.com/get/g8a72a27d8f8cb10578b5a882f884a493c0137dd400c665ed917a22f309b502cc343f4baad8296cbad03bc4a81e46292b7b9bcc87b229893a6ad6616172e593c0_640.jpg",
        title: "Breathing & Mindfulness Reset",
        description:
          "Recovery-focused session with breathing techniques and body awareness.",
        duration_min: 8,
        intensity: "easy",
        focusAreas: ["core"],
        steps: [
          "Box breathing – 2 minutes",
          "4-7-8 breathing – 2 minutes",
          "Body scan meditation – 4 minutes",
        ],
      },
      {
        id: "core_high_2",
        mediaUrl: "https://pixabay.com/get/gbb937d35342bf5a4e90418d26f01299170a5767d7f67b5906b4abbc460f6c5168bc6374f7b6615009c9b3e9186902e0c40fbed003e9469a5bb30e61285b0e09f_640.jpg",
        title: "Low-Impact Recovery Circuit",
        description: "Gentle core work with restorative movements.",
        duration_min: 12,
        intensity: "easy",
        focusAreas: ["core"],
        steps: [
          "Glute bridge – 1 minute",
          "Pelvic tilts – 1 minute",
          "Bird-dog (slow) – 1 minute",
          "Gentle ab engagement – 1 minute",
        ],
      },
    ],
  },

  full_body: {
    low: [
      {
        id: "full_body_low_1",
        mediaUrl: "https://pixabay.com/get/g396d0d5c5f0f0673bc67c64303795b8cafa3b19b64645e297f886ed92507ab56d585d7085a25959ddfa3a391c19e52faf87c9eabd1c50c975bee852d9edddcd1_640.jpg",
        title: "Full-Body Functional Workout",
        description:
          "High-intensity full-body workout with maximum muscle engagement.",
        duration_min: 22,
        intensity: "hard",
        focusAreas: ["full_body"],
        steps: [
          "Burpees – 30 seconds",
          "Squat jumps – 30 seconds",
          "Push-ups – 45 seconds",
          "Plank – 1 minute",
          "Rest – 45 seconds, repeat twice",
        ],
      },
      {
        id: "full_body_low_2",
        mediaUrl: "https://pixabay.com/get/g28402e31b94f3299e108551380e2680e6f7078632327c5c3dc68a6b1ec2467785c4db96889bcca0fc2e6035b05f86e11_640.jpg",
        title: "Beginner Bodyweight Circuit",
        description:
          "Comprehensive bodyweight circuit engaging all major muscle groups.",
        duration_min: 15,
        intensity: "medium",
        focusAreas: ["full_body"],
        steps: [
          "Squats – 45 seconds",
          "Push-ups (knee optional) – 30 seconds",
          "Glute bridge – 45 seconds",
          "Plank – 30 seconds",
          "Rest – 30 seconds, repeat twice",
        ],
      },
    ],
    moderate: [
      {
        id: "full_body_moderate_1",
        mediaUrl: "https://pixabay.com/get/g98787697bd1ecf20387d34007704c0d4ba514219ca949a5a0857b5b09970b2d008849d55d70c9c5c0c349706581157c3dfa421c0973463c8bfd44fc19ab385eb_640.jpg",
        title: "Strength & Stability Mix",
        description:
          "Well-balanced full-body workout with adequate recovery for moderate fatigue.",
        duration_min: 20,
        intensity: "medium",
        focusAreas: ["full_body"],
        steps: [
          "Lunges – 45 seconds each leg",
          "Push-ups – 45 seconds",
          "Side plank – 30 seconds each side",
          "Bird-dog – 1 minute",
          "Repeat sequence twice with 1 minute rest between",
        ],
      },
      {
        id: "full_body_moderate_2",
        mediaUrl: "https://pixabay.com/get/ga9b434d6e18e2a95e694215c5d1bca138e7ef730d9fc0998701038d45949e438f2e455004e1f63f6c614cf71bae1e48a139dc2bf000c91cc6da8ae98630cfc1_640.jpg",
        title: "Morning Mobility Flow",
        description: "Dynamic full-body movement with focus on mobility.",
        duration_min: 10,
        intensity: "easy",
        focusAreas: ["full_body"],
        steps: [
          "Neck rotations – 30 seconds",
          "Shoulder rolls – 30 seconds",
          "Cat-cow stretch – 1 minute",
          "Hip circles – 1 minute",
          "Ankle mobility – 1 minute",
          "Gentle forward fold – 1 minute",
        ],
      },
    ],
    high: [
      {
        id: "full_body_high_1",
        mediaUrl: "https://pixabay.com/get/g9b703c5e9653154cb66534f479faad1c6aaee557ec5ae7fb7c8905fdc551445671e77ddf6262fc27a0e7e11c9b3063cb12cc707a84791cf9ffe424a65bc5951a_640.jpg",
        title: "Recovery Yoga Flow",
        description:
          "Restorative full-body yoga flow for optimal recovery and stress relief.",
        duration_min: 20,
        intensity: "easy",
        focusAreas: ["full_body"],
        steps: [
          "Cat-cow – 1 minute",
          "Downward dog – 1 minute",
          "Low lunge – 1 minute each side",
          "Seated forward fold – 2 minutes",
          "Supine twist – 1 minute each side",
          "Savasana – 3 minutes",
        ],
      },
      {
        id: "full_body_high_2",
        mediaUrl: "https://pixabay.com/get/gc9789827210c68fc185963ec0dfb7b9c2de788a84d7bba8b70105443c35be0fc366b2a12359128bcc26c2aa59cc2ac23753d1e6a335fe1a70d3d8ed29c1275da_640.jpg",
        title: "Gentle Stretching Routine",
        description: "Full-body recovery stretching with gentle breathing.",
        duration_min: 10,
        intensity: "easy",
        focusAreas: ["full_body"],
        steps: [
          "Neck stretch – 30 seconds",
          "Chest opener – 1 minute",
          "Hamstring stretch – 1 minute each side",
          "Quad stretch – 1 minute each side",
          "Child's pose – 2 minutes",
        ],
      },
    ],
  },
}

export const FOCUS_AREAS: FocusArea[] = [
  "arms",
  "chest",
  "legs",
  "core",
  "full_body",
]

export function getFocusAreaLabel(area: FocusArea): string {
  const labels: Record<FocusArea, string> = {
    arms: "Arms",
    chest: "Chest",
    legs: "Legs",
    core: "Core",
    full_body: "Full Body",
  }
  return labels[area]
}

export function getWorkoutsForFocusArea(
  focusArea: FocusArea,
  fatigueLevel: FatigueLevel
): Workout[] {
  return WORKOUT_LIBRARY[focusArea][fatigueLevel]
}

export function getAllRecoveryWorkouts(): Workout[] {
  const recovery: Workout[] = []
  for (const area of FOCUS_AREAS) {
    recovery.push(...WORKOUT_LIBRARY[area].high)
  }
  // Remove duplicates by id
  const seen = new Set<string>()
  return recovery.filter((w) => {
    if (seen.has(w.id)) return false
    seen.add(w.id)
    return true
  })
}

/**
 * Get the video URL for a given workout step, if available.
 * @param stepName The exact step string from the workout step list
 * @returns The video URL (string) or undefined if not found
 */
export function getStepVideo(stepName: string): string | undefined {
  return STEP_VIDEO_MAP[stepName] || undefined
}
