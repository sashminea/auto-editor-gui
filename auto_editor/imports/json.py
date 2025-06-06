from __future__ import annotations

import os
from difflib import get_close_matches
from fractions import Fraction
from typing import TYPE_CHECKING, Any

from auto_editor.ffwrapper import FileInfo
from auto_editor.json import load
from auto_editor.lib.err import MyError
from auto_editor.timeline import (
    Clip,
    Template,
    audio_builder,
    v1,
    v3,
    visual_objects,
)
from auto_editor.utils.cmdkw import ParserError, Required, pAttrs
from auto_editor.utils.types import CoerceError

if TYPE_CHECKING:
    from auto_editor.timeline import ASpace, VSpace
    from auto_editor.utils.log import Log


def check_attrs(data: object, log: Log, *attrs: str) -> None:
    if not isinstance(data, dict):
        log.error("Data is in wrong shape!")

    for attr in attrs:
        if attr not in data:
            log.error(f"'{attr}' attribute not found!")


def check_file(path: str, log: Log) -> None:
    if not os.path.isfile(path):
        log.error(f"Could not locate media file: '{path}'")


def read_v3(tl: Any, log: Log) -> v3:
    check_attrs(
        tl,
        log,
        "background",
        "v",
        "a",
        "timebase",
        "resolution",
        "samplerate",
    )

    srcs: dict[str, FileInfo] = {}

    def make_src(v: str) -> FileInfo:
        if v in srcs:
            return srcs[v]
        temp = FileInfo.init(v, log)
        srcs[v] = temp
        return temp

    def parse_obj(obj: dict[str, Any], build: pAttrs) -> dict[str, Any]:
        kwargs: dict[str, Any] = {}
        del obj["name"]

        for attr in build.attrs:
            assert attr.coerce is not None
            if attr.default is Required:
                kwargs[attr.n] = Required
            else:
                assert attr.coerce != "source"
                kwargs[attr.n] = attr.coerce(attr.default)

        for key, val in obj.items():
            found = False
            for attr in build.attrs:
                if key == attr.n:
                    try:
                        if attr.coerce == "source":
                            kwargs[key] = make_src(val)
                        else:
                            assert attr.coerce is not None
                            kwargs[key] = attr.coerce(val)
                    except CoerceError as e:
                        raise ParserError(e)
                    found = True
                    break

            if not found:
                all_names = {attr.n for attr in build.attrs}
                if matches := get_close_matches(key, all_names):
                    more = f"\n    Did you mean:\n        {', '.join(matches)}"
                else:
                    more = (
                        f"\n    attributes available:\n        {', '.join(all_names)}"
                    )

                raise ParserError(
                    f"{build.name} got an unexpected keyword '{key}'\n{more}"
                )

        for k, v in kwargs.items():
            if v is Required:
                raise ParserError(f"'{k}' must be specified.")

        return kwargs

    bg = tl["background"]
    sr = tl["samplerate"]
    res = (tl["resolution"][0], tl["resolution"][1])
    tb = Fraction(tl["timebase"])

    v: Any = []
    a: list[list[Clip]] = []

    for vlayers in tl["v"]:
        if vlayers:
            v_out: VSpace = []
            for vdict in vlayers:
                if "name" not in vdict:
                    log.error("Invalid video object: name not specified")
                if vdict["name"] not in visual_objects:
                    log.error(f"Unknown video object: {vdict['name']}")
                my_vobj, my_build = visual_objects[vdict["name"]]

                try:
                    v_out.append(my_vobj(**parse_obj(vdict, my_build)))
                except ParserError as e:
                    log.error(e)

            v.append(v_out)

    for alayers in tl["a"]:
        if alayers:
            a_out = []
            for adict in alayers:
                if "name" not in adict:
                    log.error("Invalid audio object: name not specified")
                if adict["name"] != "audio":
                    log.error(f"Unknown audio object: {adict['name']}")

                try:
                    a_out.append(Clip(**parse_obj(adict, audio_builder)))
                except ParserError as e:
                    log.error(e)

            a.append(a_out)

    try:
        T = Template.init(srcs[next(iter(srcs))])
    except StopIteration:
        T = Template(sr, "stereo", res, [], [])

    return v3(tb, bg, T, v, a, v1=None)


def read_v1(tl: Any, log: Log) -> v3:
    from auto_editor.make_layers import clipify

    check_attrs(tl, log, "source", "chunks")

    chunks = tl["chunks"]
    path = tl["source"]

    check_file(path, log)

    src = FileInfo.init(path, log)

    vtl: VSpace = []
    atl: ASpace = [[] for _ in range(len(src.audios))]

    # Verify chunks
    last_end: int | None = None
    if type(chunks) is not list:
        log.error("chunks key must be an array")

    for i, chunk in enumerate(chunks):
        if type(chunk) is not list or len(chunk) != 3:
            log.error(f"Invalid chunk at chunk {i}")
        if type(chunk[0]) not in (int, float) or chunk[0] < 0:
            log.error(f"Invalid start at chunk {i}")
        if type(chunk[1]) not in (int, float) or chunk[1] <= chunk[0]:
            log.error(f"Invalid end at chunk {i}")
        if type(chunk[2]) not in (int, float) or chunk[2] < 0.0 or chunk[2] > 99999.0:
            log.error(f"Invalid speed at chunk {i}")

        if i == 0 and chunk[0] != 0:
            log.error("First chunk must start with 0")
        if i != 0 and chunk[0] != last_end:
            log.error(f"Invalid start at chunk {i}")
        last_end = chunk[1]

        if type(chunk[0]) is float or type(chunk[1]) is float or type(chunk[2]) is int:
            chunks[i] = (int(chunk[0]), int(chunk[1]), float(chunk[2]))

    for c in clipify(chunks, src):
        if src.videos:
            if len(vtl) == 0:
                vtl.append([])
            vtl[0].append(Clip(c.start, c.dur, c.src, c.offset, 0, c.speed))

        for a in range(len(src.audios)):
            atl[a].append(Clip(c.start, c.dur, c.src, c.offset, a, c.speed))

    return v3(
        src.get_fps(),
        "#000",
        Template.init(src),
        vtl,
        atl,
        v1(src, chunks),
    )


def read_json(path: str, log: Log) -> v3:
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            tl = load(path, f)
    except FileNotFoundError:
        log.error(f"File not found: {path}")
    except MyError as e:
        log.error(e)

    check_attrs(tl, log, "version")

    ver = tl["version"]

    if ver == "3":
        return read_v3(tl, log)
    if ver == "1":
        return read_v1(tl, log)
    if type(ver) is not str:
        log.error("version needs to be a string")
    log.error(f"Importing version {ver} timelines is not supported.")
