#!/bin/bash
set -e

this_user="`id -u`:`id -g`"
user="$1"
cmd="$2"

finish() {
  if [[ "$this_user" != "$user" ]]
  then chown -R ${user} /root
  fi
}
trap finish EXIT

echo "Running command as "$this_user" (target user: $user)"
bash -c "$cmd"
