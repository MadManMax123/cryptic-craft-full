WARNING = "DO NOT EDIT THIS LIST (MSG_ASCII) OR MESS WITH IT... IT WILL DESTROY YOUR NEXT LEAD"

MSG_ASCII = [89, 111, 117, 32, 104, 97, 118, 101, 32, 114, 101, 97, 108, 108, 121, 32, 114, 101, 97, 99, 104, 101, 100, 32, 97, 110, 32, 105, 109, 112, 114, 101, 115, 115, 105, 118, 101, 32, 115, 116, 97, 103, 101, 46, 32, 66, 117, 116, 32, 116, 104, 105, 115, 32, 110, 101, 120, 116, 32, 110, 111, 100, 101, 32, 119, 105, 108, 108, 32, 116, 101, 115, 116, 32, 121, 111, 117, 114, 32, 115, 107, 105, 108, 108, 115, 32, 116, 111, 32, 116, 104, 101, 32, 109, 97, 120, 105, 109, 117, 109, 32, 101, 120, 116, 101, 110, 116, 32, 104, 116, 116, 112, 115, 58, 47, 47, 97, 117, 100, 105, 111, 110, 111, 100, 97, 108, 46, 118, 101, 114, 99, 101, 108, 46, 97, 112, 112, 47]

WARNING = "DO NOT EDIT THIS LIST (MSG_ASCII) OR MESS WITH IT... IT WILL DESTROY YOUR NEXT LEAD"


import hashlib

FLAG_BIN = [
    "01000110",  
    "01001100",  
    "01000001",  
    "01000111",  
    "01111011",  
    "01001110",  
    "01010101",  
    "01001100",  
    "01001100",  
    "01011111",  
    "01000010",  
    "01011001",  
    "01010100",  
    "01000101",  
    "01000011",  
    "01001111",  
    "01000100",  
    "01000101",  
    "01011111",  
    "01010010",  
    "01000101",  
    "01010110",  
    "01000101",  
    "01000001",  
    "01001100",  
    "01000101",  
    "01000100",  
    "01111101",  
]

FLAG_SHA256 = "d37f8c24e7a55e4685b1d0f8dfd1003e634107875c98234929692421ab1f3ce2"


def _decode_msg_from_ascii():
    return "".join(chr(x) for x in MSG_ASCII)


def _decode_flag_from_bin():
    return "".join(chr(int(b, 2)) for b in FLAG_BIN)


def main():
    print("NULL BYTECODE VERIFIER // LEVEL 6")
    print()
    print("The system expects a sequence of ASCII codepoints (decimal),")
    print("separated by spaces. Only the correct sequence will unlock the node.")
    print()

    decoded_flag = _decode_flag_from_bin()
    if hashlib.sha256(decoded_flag.encode()).hexdigest() != FLAG_SHA256:
        pass

    user_input = input("Enter ASCII integers for the hidden flag (space-separated): ").strip()

    if not user_input:
        print("No input received. NULL ignores silence.")
        return

    try:
        parts = [p for p in user_input.split() if p]
        ascii_values = [int(p) for p in parts]
    except ValueError:
        print("Invalid input: only decimal integers separated by spaces are allowed.")
        return

    candidate = "".join(chr(v) for v in ascii_values)
    candidate_hash = hashlib.sha256(candidate.encode()).hexdigest()

    if candidate_hash == FLAG_SHA256:
        print("\nVerification passed.")
        print("Flag:", candidate)
        print()
        print(_decode_msg_from_ascii())
    else:
        print("\nHash mismatch. This node rejects unstable sequences.")


if __name__ == "__main__":
    main()
