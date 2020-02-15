#!/bin/bash
set -e

this_user="`id -u`:`id -g`"
user="$1"
shift;
cmd="$@"

finish() {
  if [[ "$this_user" == "$user" ]]
  then echo "Same user, skipping permission fix"
  else
    echo "Fixing permissions for $user"
    chown -R ${user} /root
  fi
}
trap finish EXIT SIGINT

echo "Running command as "$this_user" (target user: $user)"
bash -c "$cmd"
