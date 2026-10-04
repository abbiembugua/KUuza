import re

# ---------------------------------------------------------------------------
# Each entry is compiled with word-boundary anchors so "assassin", "classic",
# "scunthorpe", etc. don't get caught as false positives.
# The list covers English profanity, common slurs, and Swahili insults most
# likely to appear on a Kenyan campus platform.
# ---------------------------------------------------------------------------

_RAW = [
    # ── English profanity ────────────────────────────────────────────────
    r"fuck", r"f+u+c+k+", r"fck", r"fuk",
    r"shit", r"sh1t", r"bullshit",
    r"bitch", r"b1tch",
    r"asshole", r"a$$hole", r"arsehole",
    r"bastard",
    r"cunt",
    r"dick", r"d1ck",
    r"cock",
    r"pussy",
    r"whore",
    r"slut",
    r"piss\s*off",
    r"motherfucker", r"mofo",
    r"wanker",
    r"twat",
    # ── Racial / ethnic slurs ────────────────────────────────────────────
    r"nigger", r"nigg[ae]r", r"n1gger",
    r"nigga",
    r"kaffir",
    r"chink",
    r"spic",
    r"wetback",
    r"gook",
    r"towelhead",
    r"sandnigger",
    r"cracker",
    r"honky",
    r"beaner",
    r"redskin",
    # ── Homophobic / transphobic slurs ──────────────────────────────────
    r"faggot", r"f[a4]gg[o0]t",
    r"dyke",
    r"tranny",
    # ── General harassment / threats ────────────────────────────────────
    r"kill\s+yourself", r"kys",
    r"go\s+die",
    r"i('ll|will)\s+(kill|hurt|rape|stab|shoot)\s+you",
    r"rape",
    r"molest",
    r"paedophile", r"pedophile",
    # ── Swahili profanity / insults ──────────────────────────────────────
    r"mafi",          # excrement
    r"malaya",        # prostitute
    r"mnasaba",
    r"umbwa",         # dog (used as insult)
    r"mkundu",        # anus (insult)
    r"nyege",         # lust (used vulgarly)
    r"shenzi",        # uncivilised / worthless
    r"mjinga",        # idiot / fool
    r"pumbavu",       # fool / idiot
    r"takataka",      # rubbish / worthless person
    r"fala",          # fool
]

# Compile once at import time — word boundaries + case-insensitive
_PATTERNS = [re.compile(r"\b" + p + r"\b", re.IGNORECASE) for p in _RAW]

_BLOCK_MSG = (
    "Your message contains language that is not allowed on KUuza. "
    "Please keep the conversation respectful."
)


def check_content(text: str) -> str | None:
    """
    Returns an error message string if the text contains banned content,
    or None if the content is clean.
    """
    for pattern in _PATTERNS:
        if pattern.search(text):
            return _BLOCK_MSG
    return None
