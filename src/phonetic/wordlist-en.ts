/**
 * A corpus of common English words (lowercase letters only) used both as the
 * training data for the phonetic Markov model and as the source for the
 * "natural words" option. Kept compact on purpose — the Markov model
 * generalises it into an unbounded stream of pronounceable pseudo-words.
 */
export const EN_WORDS: readonly string[] = [
  "the", "and", "that", "have", "for", "not", "with", "you", "this", "but",
  "his", "from", "they", "say", "her", "she", "will", "one", "all", "would",
  "there", "their", "what", "out", "about", "who", "get", "which", "when",
  "make", "can", "like", "time", "just", "him", "know", "take", "into", "year",
  "your", "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also", "back",
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "thing",
  "many", "more", "such", "where", "much", "before", "right", "too", "means",
  "old", "same", "tell", "boy", "follow", "came", "show", "around", "form",
  "small", "set", "put", "end", "does", "another", "great", "again", "still",
  "should", "found", "world", "high", "every", "near", "add", "food", "between",
  "own", "below", "country", "plant", "last", "school", "father", "keep",
  "tree", "never", "start", "city", "earth", "eye", "light", "thought", "head",
  "under", "story", "saw", "left", "few", "while", "along", "might", "close",
  "something", "seem", "next", "hard", "open", "example", "begin", "life",
  "always", "those", "both", "paper", "together", "got", "group", "often",
  "run", "important", "until", "children", "side", "feet", "car", "mile",
  "night", "walk", "white", "sea", "began", "grow", "took", "river", "four",
  "carry", "state", "once", "book", "hear", "stop", "without", "second",
  "later", "miss", "idea", "enough", "eat", "face", "watch", "far", "really",
  "almost", "above", "girl", "sometimes", "mountain", "cut", "young", "talk",
  "soon", "list", "song", "leave", "family", "music", "color", "stand", "sun",
  "bird", "soil", "area", "horse", "bright", "feel", "fact", "inch", "able",
  "matter", "circle", "size", "wood", "field", "fish", "south", "plain",
  "common", "gold", "ground", "happen", "wind", "behind", "cannot", "human",
  "money", "morning", "step", "early", "reach", "remember", "garden", "warm",
  "free", "minute", "strong", "object", "decide", "surface", "deep", "moon",
  "island", "foot", "yet", "busy", "test", "record", "boat", "common", "build",
  "heart", "force", "brought", "understand", "drive", "stood", "contain",
  "front", "teach", "week", "final", "gave", "green", "quick", "develop",
  "ocean", "speed", "instead", "ready", "anything", "divide", "general",
  "energy", "subject", "europe", "moon", "region", "return", "believe",
  "dance", "speak", "weight", "language", "machine", "level", "voice", "modern",
];
