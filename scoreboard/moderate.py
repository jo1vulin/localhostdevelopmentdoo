import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = 'https://localhost-scores.jo1vulin.workers.dev/'
KEY = (Path(__file__).with_name('.admin-key')).read_text().strip()


def call(method, params):
    req = urllib.request.Request(API + '?' + urllib.parse.urlencode(params), method=method, headers={'Authorization': f'Bearer {KEY}', 'User-Agent': 'localhost-moderate/1'})
    with urllib.request.urlopen(req) as res:
        return json.load(res)


def show(rows):
    for i, r in enumerate(rows, 1):
        detail = f"{r.get('speed')} km/h, {r.get('jumps')} jumps" if 'speed' in r else f"stage {r.get('stage')}, {r.get('killed')} tanks"
        print(f"{i:>3}. {r['name']:<12} {r['score']:>7}  {detail:<22} {r.get('theme', ''):<6} {r['at']}")


def main(argv):
    game = argv[1] if len(argv) > 1 else ''
    action = argv[2] if len(argv) > 2 else 'list'
    if game not in ('battle', 'eleanor'):
        print('usage: moderate.sh battle|eleanor [list | remove <at> | remove-name <name>]')
        return 1
    if action == 'list':
        show(call('GET', {'game': game, 'all': '1'})['scores'])
    elif action in ('remove', 'remove-name') and len(argv) > 3:
        data = call('DELETE', {'game': game, 'at' if action == 'remove' else 'name': argv[3]})
        print(f"removed {data['removed']}, {len(data['scores'])} left")
        show(data['scores'])
    else:
        print(f'unknown action {action}')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
