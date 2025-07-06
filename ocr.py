import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from gtts import gTTS
import io
import base64
from dotenv import load_dotenv
import datetime
import re
import cv2
import numpy as np
from PIL import Image
import pytesseract

app = Flask(__name__)
CORS(app)

# Load environment variables from .env file
# ... existing code ...

def preprocess_for_ocr(image_array):
    """Preprocesses an image numpy array for better OCR results."""
    if len(image_array.shape) == 2:
        image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
    elif image_array.shape[2] == 4:
        image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
        
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary

class MRZParser:
    @staticmethod
    def parse(ocr_text):
        lines = ocr_text.strip().split('\n')
        cleaned_lines = [re.sub(r'[^A-Z0-9<]', '', line.upper()) for line in lines if line.strip()]
        print(f"--- MRZ DEBUG: Cleaned OCR Input ---\n{cleaned_lines}\n---------------------------------")

        # Filter for lines that could plausibly be part of an MRZ. A real MRZ line must contain '<'.
        mrz_lines = [l for l in cleaned_lines if len(l) > 20 and '<' in l]
        if len(mrz_lines) < 2: # Need at least 2 plausible lines for robust parsing
            return {"Error": "Invalid MRZ data: Not enough valid lines found."}

        # Combine all candidate lines into a single block for robust parsing
        full_mrz_text = "".join(mrz_lines)
        
        parsed_data = {}
        print(f"--- MRZ DEBUG ---\nFull Text Block: {full_mrz_text}\n-------------------")

        # 1. Parse Name
        try:
            name_line_candidate = None
            print("--- DEBUG: Identifying Name Line ---")
            # The name line has '<<' and more letters than numbers.
            for i, line in enumerate(mrz_lines):
                is_name_line = '<<' in line and sum(c.isalpha() for c in line) > sum(c.isdigit() for c in line)
                print(f"Line {i}: '{line}' -> Is name line? {is_name_line}")
                if is_name_line:
                    name_line_candidate = line
                    break

            if name_line_candidate:
                print(f"Found name line: '{name_line_candidate}'")
                # Format is SURNAME<<GIVEN<NAMES...
                parts = name_line_candidate.split('<<', 1)
                surname = mrz_lines[2].replace('<', ' ').strip()
                last_name = surname.split('  ')[0]
                first_name = surname.split('  ')[1]

                # parsed_data['Full Name'] = f"{last_name} {first_name}".strip()
                parsed_data['lastname'] = last_name
                parsed_data['firstname'] = first_name
                print(f"Extracted Name: '{parsed_data['Full Name']}' (Last Name: '{last_name}', First Name: '{first_name}')")
            else:
                print("--- DEBUG: No name line found ---")
        except Exception as e:
            print(f"Error parsing Name: {e}")

        # 2. Parse Dates and Gender
        try:
            date_match = re.search(r'(\d{6}).*?([MF]).*?(\d{6})', mrz_lines[1])
            if date_match:
                dob_str, gender, exp_str = date_match.groups()

                
                year = int(dob_str[0:2])
                current_year_short = datetime.datetime.now().year % 100
                century = "19" if year > (current_year_short + 15) else "20"
                parsed_data['date_of_birth'] = f"{century}{year:02d}-{dob_str[2:4]}-{dob_str[4:6]}"
                parsed_data['gender'] = gender
                
                exp_year = int(exp_str[0:2])
                parsed_data['expiry_date'] = f"20{exp_year:02d}-{exp_str[2:4]}-{exp_str[4:6]}"
                print(f"Extracted Dates/Gender: DOB '{dob_str}', Gender '{gender}', Expiry '{exp_str}'")
        except (ValueError, IndexError, TypeError) as e:
            print(f"Error parsing Dates/Gender: {e}")

        # 3. Parse CIN (Personal Number) with multiple fallbacks
        try:
            cin_block = mrz_lines[0].split('<')
            # remove first character
            cin = cin_block[1][1:]
            parsed_data['cin'] = cin
            print(f"Extracted Personal Number as CIN '{parsed_data['CIN']}' with full pattern")

        except Exception as e:
            print(f"Error parsing CIN: {e}")

        print(f"--- END MRZ DEBUG ---\nFinal Parsed Data: {parsed_data}\n-----------------------")
        

        return parsed_data

@app.route('/chat', methods=['POST'])
def chat_handler():
    try:
        # Placeholder logic
        return jsonify({'message': 'Chat endpoint not yet implemented.'})
    except Exception as e:
        print(f"Error in /chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/mrz-scan', methods=['POST'])
def mrz_scan_handler():
    print('Received request at /mrz-scan')
    if 'image' not in request.files:
        print('No image part in the request')
        return jsonify({'error': 'No image part in the request'}), 400
    
    file = request.files['image']
    if file.filename == '':
        print('No image selected for uploading')
        return jsonify({'error': 'No image selected for uploading'}), 400

    try:
        print('Processing image...')
        # Read image from stream and convert to numpy array
        image = Image.open(file.stream).convert("RGB")
        image_np = np.array(image)
        print('Image loaded and converted to numpy array')
        
        # Preprocess for OCR
        preprocessed_image = preprocess_for_ocr(image_np)
        print('Image preprocessed for OCR')
        
        # Perform OCR
        ocr_text = pytesseract.image_to_string(preprocessed_image)
        print('OCR performed')
        
        # Parse MRZ
        parsed_data = MRZParser.parse(ocr_text)
        print('MRZ parsed:', parsed_data)
        
        return jsonify(parsed_data)

    except Exception as e:
        print(f"Error in /mrz-scan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/ping')
def ping():
    return 'pong'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)