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


def show_log(rows):
    for r in rows:
        if r.get('path') == 'start':
            what = f"start {r.get('token', '')}"
        else:
            detail = f"{r.get('detail')} km/h" if r.get('game') == 'eleanor' else f"stage {r.get('stage')}, {r.get('detail')} tanks"
            elapsed = '' if r.get('elapsed') is None else f" after {r['elapsed']} s"
            what = f"submit {r.get('token', '')} {r.get('name')!s:<12} {r.get('score'):>6}  {detail}{elapsed}: {r.get('outcome')}" + (f" (rank {r['rank']})" if r.get('rank') else '')
        print(f"{r['at'][:19]}Z {r['ip']:<15} {r.get('game', ''):<7} {what}   {r.get('ua', '')[:60]}")


def main(argv):
    game = argv[1] if len(argv) > 1 else ''
    action = argv[2] if len(argv) > 2 else 'list'
    if game not in ('battle', 'eleanor'):
        print('usage: moderate.sh battle|eleanor [list | log | remove <at> | remove-name <name>]')
        return 1
    if action == 'list':
        show(call('GET', {'game': game, 'all': '1'})['scores'])
    elif action == 'log':
        show_log(call('GET', {'game': game, 'log': '1'})['log'])
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
