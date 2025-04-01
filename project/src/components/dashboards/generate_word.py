from docx import Document

def generate_word_document(data):
    # Load template
    doc = Document('allergist-prescription-template.docx')

    # Fill template
    for paragraph in doc.paragraphs:
        if 'Name:' in paragraph.text:
            paragraph.text = f'Name: {data["name"]}'
        elif 'Age:' in paragraph.text:
            paragraph.text = f'Age: {data["age"]}'
        elif 'Sex:' in paragraph.text:
            paragraph.text = f'Sex: {data["sex"]}'
        elif 'Diagnosis:' in paragraph.text:
            paragraph.text = f'Diagnosis: {data["diagnosis"]}'
        elif 'Date:' in paragraph.text:
            paragraph.text = f'Date: {data["date"]}'

    # Save the filled document
    output_path = 'filled-form.docx'
    doc.save(output_path)
    print(f'Document saved as {output_path}')

# Example usage:
patient_data = {
    "name": "John Doe",
    "age": "30",
    "sex": "Male",
    "diagnosis": "Hypertension",
    "date": "2024-03-13"
}

generate_word_document(patient_data)
