#!/usr/bin/env bash

openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout dev.key -out dev.crt \
  -subj "/C=US/ST=CA/L=Irvine/O=Acme Inc./CN=localhost" \
  -reqexts v3_req -reqexts SAN -extensions SAN \
  -config \
  <(echo -e '
    [req]\n
    distinguished_name=req_distinguished_name\n
    [req_distinguished_name]\n
    [SAN]\n
    subjectKeyIdentifier=hash\n
    authorityKeyIdentifier=keyid:always,issuer:always\n
    basicConstraints=CA:TRUE\n
    subjectAltName=IP:10.0.2.2
  ')

openssl x509 -in dev.crt -outform der -out dev.der.crt

openssl x509 -in dev.crt -text -noout
