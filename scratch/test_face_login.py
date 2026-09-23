import base64, io, urllib.request, json
from app.services.memory_service import memory_service

res = memory_service.client.scroll(collection_name='user_profiles', limit=1, with_payload=True)
p = res[0][0]
img_b64 = p.payload.get('image_base64')
if ',' in img_b64:
    img_b64 = img_b64.split(',', 1)[1]
img_bytes = base64.b64decode(img_b64)

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = io.BytesIO()
body.write(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="face.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
body.write(img_bytes)
body.write(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/face-login', data=body.getvalue(), method='POST')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
resp = urllib.request.urlopen(req)
data = json.loads(resp.read().decode())
print('Status:', resp.getcode())
print('Face Login Result:', {k: data[k] for k in data if k != 'image_base64'})
