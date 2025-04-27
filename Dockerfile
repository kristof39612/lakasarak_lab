FROM python:3.12-slim

RUN apt update
RUN apt upgrade -y
RUN apt clean && rm -rf /var/lib/apt/lists/*


WORKDIR /code

COPY requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py /code/
COPY *.pkl /code/
ADD frontend/build /code/frontend/build

ENTRYPOINT ["python", "app.py"]