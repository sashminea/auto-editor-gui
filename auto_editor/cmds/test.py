from __future__ import annotations

import os
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from fractions import Fraction
from time import perf_counter
from typing import TYPE_CHECKING

import av
import numpy as np

from auto_editor.ffwrapper import FileInfo, initFileInfo
from auto_editor.lang.palet import Lexer, Parser, env, interpret
from auto_editor.lang.stdenv import make_standard_env
from auto_editor.lib.data_structs import Char
from auto_editor.lib.err import MyError
from auto_editor.utils.log import Log
from auto_editor.vanparse import ArgumentParser

if TYPE_CHECKING:
    from collections.abc import Callable
    from typing import Any

    from auto_editor.vanparse import ArgumentParser


@dataclass(slots=True)
class TestArgs:
    only: list[str] = field(default_factory=list)
    help: bool = False
    no_fail_fast: bool = False
    category: str = "cli"


def test_options(parser: ArgumentParser) -> ArgumentParser:
    parser.add_argument("--only", "-n", nargs="*")
    parser.add_argument("--no-fail-fast", flag=True)
    parser.add_required(
        "category",
        nargs=1,
        choices=("palet", "cli", "sub", "all"),
        metavar="category [options]",
    )
    return parser


def pipe_to_console(cmd: list[str]) -> tuple[int, str, str]:
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    return process.returncode, stdout.decode("utf-8"), stderr.decode("utf-8")


class Runner:
    def __init__(self) -> None:
        self.program = [sys.executable, "-m", "auto_editor"]

    def main(
        self, inputs: list[str], cmd: list[str], output: str | None = None
    ) -> str | None:
        cmd = self.program + inputs + cmd + ["--no-open"]

        if output is not None:
            root, ext = os.path.splitext(output)
            if inputs and ext == "":
                output = root + os.path.splitext(inputs[0])[1]
            cmd += ["--output", output]

        if output is None and inputs:
            root, ext = os.path.splitext(inputs[0])

            if "--export_as_json" in cmd:
                ext = ".json"
            elif "-exp" in cmd:
                ext = ".xml"
            elif "-exf" in cmd:
                ext = ".fcpxml"
            elif "-exs" in cmd:
                ext = ".mlt"

            output = f"{root}_ALTERED{ext}"

        returncode, stdout, stderr = pipe_to_console(cmd)
        if returncode > 0:
            raise Exception(f"{stdout}\n{stderr}\n")

        return output

    def raw(self, cmd: list[str]) -> None:
        returncode, stdout, stderr = pipe_to_console(self.program + cmd)
        if returncode > 0:
            raise Exception(f"{stdout}\n{stderr}\n")

    def check(self, cmd: list[str], match=None) -> None:
        returncode, stdout, stderr = pipe_to_console(self.program + cmd)
        if returncode > 0:
            if "Error!" in stderr:
                if match is not None and match not in stderr:
                    raise Exception(f'Could\'t find "{match}"')
            else:
                raise Exception(
                    f"Program crashed but should have shown an error.\n{' '.join(cmd)}\n{stdout}\n{stderr}"
                )
        else:
            raise Exception("Program should not respond with code 0 but did!")


def run_tests(tests: list[Callable], args: TestArgs) -> None:
    def clean_all() -> None:
        def clean(the_dir: str) -> None:
            for item in os.listdir(the_dir):
                if "_ALTERED" in item:
                    os.remove(os.path.join(the_dir, item))
                if item.endswith("_tracks"):
                    shutil.rmtree(os.path.join(the_dir, item))

        clean("resources")
        clean(os.getcwd())

    if args.only != []:
        tests = list(filter(lambda t: t.__name__ in args.only, tests))

    total_time = 0.0

    passed = 0
    total = len(tests)
    for index, test in enumerate(tests, start=1):
        name = test.__name__
        start = perf_counter()
        outputs = None

        try:
            outputs = test()
            dur = perf_counter() - start
            total_time += dur
        except KeyboardInterrupt:
            print("Testing Interrupted by User.")
            clean_all()
            sys.exit(1)
        except Exception as e:
            dur = perf_counter() - start
            total_time += dur
            print(
                f"{name:<24} ({index}/{total})  {round(dur, 2):<4} secs  \033[1;31m[FAILED]\033[0m",
                flush=True,
            )
            if args.no_fail_fast:
                print(f"\n{e}")
            else:
                print("")
                clean_all()
                raise e
        else:
            passed += 1
            print(
                f"{name:<24} ({index}/{total})  {round(dur, 2):<4} secs  [\033[1;32mPASSED\033[0m]",
                flush=True,
            )
        if outputs is not None:
            if isinstance(outputs, str):
                outputs = [outputs]

            for out in outputs:
                try:
                    os.remove(out)
                except FileNotFoundError:
                    pass

    print(f"\nCompleted\n{passed}/{total}\n{round(total_time, 2)} secs")
    clean_all()


def main(sys_args: list[str] | None = None):
    if sys_args is None:
        sys_args = sys.argv[1:]

    args = test_options(ArgumentParser("test")).parse_args(TestArgs, sys_args)

    run = Runner()
    log = Log()

    def fileinfo(path: str) -> FileInfo:
        return initFileInfo(path, log)

    ### Tests ###

    all_files = (
        "aac.m4a",
        "alac.m4a",
        "wav/pcm-f32le.wav",
        "wav/pcm-s32le.wav",
        "multi-track.mov",
        "mov_text.mp4",
        "testsrc.mkv",
    )

    ## API Tests ##

    def help_tests():
        """check the help option, its short, and help on options and groups."""
        run.raw(["--help"])
        run.raw(["-h"])
        run.raw(["--margin", "--help"])
        run.raw(["--edit", "-h"])
        run.raw(["--help", "--help"])
        run.raw(["-h", "--help"])
        run.raw(["--help", "-h"])

    def version_test():
        """Test version flags and debug by itself."""
        run.raw(["--version"])
        run.raw(["-V"])

    def parser_test():
        run.check(["example.mp4", "--video-speed"], "needs argument")

    def info():
        run.raw(["info", "example.mp4"])
        run.raw(["info", "resources/only-video/man-on-green-screen.mp4"])
        run.raw(["info", "resources/multi-track.mov"])
        run.raw(["info", "resources/new-commentary.mp3"])
        run.raw(["info", "resources/testsrc.mkv"])

    def levels():
        run.raw(["levels", "resources/multi-track.mov"])
        run.raw(["levels", "resources/new-commentary.mp3"])

    def subdump():
        run.raw(["subdump", "resources/mov_text.mp4"])
        run.raw(["subdump", "resources/webvtt.mkv"])

    def desc():
        run.raw(["desc", "example.mp4"])

    def example():
        out = run.main(inputs=["example.mp4"], cmd=[])

        with av.open(out) as container:
            assert container.streams[0].type == "video"
            assert container.streams[1].type == "audio"

        cn = fileinfo(out)
        video = cn.videos[0]

        assert video.fps == 30
        # assert video.time_base == Fraction(1, 30)
        assert video.width == 1280
        assert video.height == 720
        assert video.codec == "h264"
        assert video.lang == "eng"
        assert cn.audios[0].codec == "aac"
        assert cn.audios[0].samplerate == 48000
        assert cn.audios[0].lang == "eng"

        return out

    # PR #260
    def high_speed_test():
        return run.check(["example.mp4", "--video-speed", "99998"], "empty")

    # Issue #184
    def units():
        run.main(["example.mp4"], ["--edit", "all/e", "--set-speed", "125%,-30,end"])
        return run.main(["example.mp4"], ["--edit", "audio:threshold=4%"])

    def sr_units():
        run.main(["example.mp4"], ["--sample_rate", "44100 Hz"])
        return run.main(["example.mp4"], ["--sample_rate", "44.1 kHz"])

    def video_speed():
        return run.main(["example.mp4"], ["--video-speed", "1.5"])

    def backwards_range():
        """
        Cut out the last 5 seconds of a media file by using negative number in the
        range.
        """
        run.main(["example.mp4"], ["--edit", "none", "--cut_out", "-5secs,end"])
        return run.main(["example.mp4"], ["--edit", "all/e", "--add_in", "-5secs,end"])

    def cut_out():
        run.main(
            ["example.mp4"],
            [
                "--edit",
                "none",
                "--video_speed",
                "2",
                "--silent_speed",
                "3",
                "--cut_out",
                "2secs,10secs",
            ],
        )
        return run.main(
            ["example.mp4"],
            ["--edit", "all/e", "--video_speed", "2", "--add_in", "2secs,10secs"],
        )

    def gif():
        """
        Feed auto-editor a gif file and make sure it can spit out a correctly formatted
        gif. No editing is requested.
        """
        out = run.main(
            ["resources/only-video/man-on-green-screen.gif"], ["--edit", "none"]
        )
        assert fileinfo(out).videos[0].codec == "gif"

        return out

    def margin_tests():
        run.main(["example.mp4"], ["-m", "3"])
        run.main(["example.mp4"], ["--margin", "3"])
        run.main(["example.mp4"], ["-m", "0.3sec"])
        run.main(["example.mp4"], ["-m", "6,-3secs"])
        return run.main(["example.mp4"], ["-m", "0.4 seconds", "--stats"])

    def input_extension():
        """Input file must have an extension. Throw error if none is given."""

        shutil.copy("example.mp4", "example")
        run.check(["example", "--no-open"], "must have an extension")

        return "example"

    def output_extension():
        # Add input extension to output name if no output extension is given.
        out = run.main(inputs=["example.mp4"], cmd=[], output="out")

        assert out == "out.mp4"
        assert fileinfo(out).videos[0].codec == "h264"

        out = run.main(inputs=["resources/testsrc.mkv"], cmd=[], output="out")
        assert out == "out.mkv"
        assert fileinfo(out).videos[0].codec == "h264"

        return "out.mp4", "out.mkv"

    def progress():
        run.main(["example.mp4"], ["--progress", "machine"])
        run.main(["example.mp4"], ["--progress", "none"])
        return run.main(["example.mp4"], ["--progress", "ascii"])

    def silent_threshold():
        return run.main(
            ["resources/new-commentary.mp3"], ["--edit", "audio:threshold=0.1"]
        )

    def track_tests():
        out = run.main(["resources/multi-track.mov"], ["--keep_tracks_seperate"])
        assert len(fileinfo(out).audios) == 2

        return out

    def export_json_tests():
        out = run.main(["example.mp4"], ["--export_as_json"])
        out2 = run.main([out], [])
        return out, out2

    def import_v1_tests():
        with open("v1.json", "w") as file:
            file.write(
                """{"version": "1", "source": "example.mp4", "chunks": [ [0, 26, 1.0], [26, 34, 0] ]}"""
            )

        return "v1.json", run.main(["v1.json"], [])

    def premiere_named_export():
        run.main(["example.mp4"], ["--export", 'premiere:name="Foo Bar"'])

    def export_subtitles():
        # cn = fileinfo(run.main(["resources/mov_text.mp4"], []))

        # assert len(cn.videos) == 1
        # assert len(cn.audios) == 1
        # assert len(cn.subtitles) == 1

        cn = fileinfo(run.main(["resources/webvtt.mkv"], []))

        assert len(cn.videos) == 1
        assert len(cn.audios) == 1
        assert len(cn.subtitles) == 1

    def resolution_and_scale():
        cn = fileinfo(run.main(["example.mp4"], ["--scale", "1.5"]))

        assert cn.videos[0].fps == 30
        assert cn.videos[0].width == 1920
        assert cn.videos[0].height == 1080
        assert cn.audios[0].samplerate == 48000

        cn = fileinfo(run.main(["example.mp4"], ["--scale", "0.2"]))

        assert cn.videos[0].fps == 30
        assert cn.videos[0].width == 256
        assert cn.videos[0].height == 144
        assert cn.audios[0].samplerate == 48000

        out = run.main(["example.mp4"], ["-res", "700,380", "-b", "darkgreen"])
        cn = fileinfo(out)

        assert cn.videos[0].fps == 30
        assert cn.videos[0].width == 700
        assert cn.videos[0].height == 380
        assert cn.audios[0].samplerate == 48000

        return out

    def premiere():
        results = set()
        for test_name in all_files:
            test_file = f"resources/{test_name}"
            p_xml = run.main([test_file], ["-exp"])
            results.add(p_xml)
            results.add(run.main([p_xml], []))

        return tuple(results)

    def export():
        results = set()

        for test_name in all_files:
            test_file = f"resources/{test_name}"
            results.add(run.main([test_file], []))
            run.main([test_file], ["--edit", "none"])
            results.add(run.main([test_file], ["--export", "final-cut-pro:version=10"]))
            results.add(run.main([test_file], ["--export", "final-cut-pro:version=11"]))
            results.add(run.main([test_file], ["-exs"]))
            results.add(run.main([test_file], ["--export_as_clip_sequence"]))
            run.main([test_file], ["--stats"])

        return tuple(results)

    def codec_tests():
        run.main(["example.mp4"], ["--video_codec", "h264"])
        return run.main(["example.mp4"], ["--audio_codec", "ac3"])

    # Issue #241
    def multi_track_edit():
        out = run.main(
            ["example.mp4", "resources/multi-track.mov"],
            ["--edit", "audio:stream=1"],
            "out.mov",
        )
        assert len(fileinfo(out).audios) == 1

        return out

    def concat():
        out = run.main(["example.mp4"], ["--cut-out", "0,171"], "hmm.mp4")
        out2 = run.main(["example.mp4", "hmm.mp4"], ["--debug"])
        return out, out2

    def concat_mux_tracks():
        out = run.main(["example.mp4", "resources/multi-track.mov"], [], "out.mov")
        assert len(fileinfo(out).audios) == 1

        return out

    def concat_multiple_tracks():
        out = run.main(
            ["resources/multi-track.mov", "resources/multi-track.mov"],
            ["--keep-tracks-separate"],
            "out.mov",
        )
        assert len(fileinfo(out).audios) == 2
        out = run.main(
            ["example.mp4", "resources/multi-track.mov"],
            ["--keep-tracks-separate"],
            "out.mov",
        )
        assert len(fileinfo(out).audios) == 2

        return out

    def frame_rate():
        cn = fileinfo(run.main(["example.mp4"], ["-r", "15", "--no-seek"]))
        video = cn.videos[0]
        assert video.fps == 15, video.fps
        assert video.duration - 17.33333333333333333333333 < 3, video.duration

        cn = fileinfo(run.main(["example.mp4"], ["-r", "20"]))
        video = cn.videos[0]
        assert video.fps == 20, video.fps
        assert video.duration - 17.33333333333333333333333 < 2

        cn = fileinfo(out := run.main(["example.mp4"], ["-r", "60"]))
        video = cn.videos[0]

        assert video.fps == 60, video.fps
        assert video.duration - 17.33333333333333333333333 < 0.3

        return out

    # def embedded_image():
    #     out1 = run.main(["resources/embedded-image/h264-png.mp4"], [])
    #     cn = fileinfo(out1)
    #     assert cn.videos[0].codec == "h264"
    #     assert cn.videos[1].codec == "png"

    #     out2 = run.main(["resources/embedded-image/h264-mjpeg.mp4"], [])
    #     cn = fileinfo(out2)
    #     assert cn.videos[0].codec == "h264"
    #     assert cn.videos[1].codec == "mjpeg"

    #     out3 = run.main(["resources/embedded-image/h264-png.mkv"], [])
    #     cn = fileinfo(out3)
    #     assert cn.videos[0].codec == "h264"
    #     assert cn.videos[1].codec == "png"

    #     out4 = run.main(["resources/embedded-image/h264-mjpeg.mkv"], [])
    #     cn = fileinfo(out4)
    #     assert cn.videos[0].codec == "h264"
    #     assert cn.videos[1].codec == "mjpeg"

    #     return out1, out2, out3, out4

    def motion():
        out = run.main(
            ["resources/only-video/man-on-green-screen.mp4"],
            ["--edit", "motion", "--margin", "0"],
        )
        out2 = run.main(
            ["resources/only-video/man-on-green-screen.mp4"],
            ["--edit", "motion:threshold=0,width=200"],
        )
        return out, out2

    def edit_positive_tests():
        run.main(["resources/multi-track.mov"], ["--edit", "audio:stream=all"])
        run.main(["resources/multi-track.mov"], ["--edit", "not audio:stream=all"])
        run.main(
            ["resources/multi-track.mov"],
            ["--edit", "(or (not audio:threshold=4%) audio:stream=1)"],
        )
        out = run.main(
            ["resources/multi-track.mov"],
            ["--edit", "(or (not audio:threshold=4%) (not audio:stream=1))"],
        )
        return out

    def edit_negative_tests():
        run.check(
            ["resources/wav/example-cut-s16le.wav", "--edit", "motion"],
            "video stream '0' does not ",
        )
        run.check(
            ["resources/only-video/man-on-green-screen.gif", "--edit", "audio"],
            "audio stream '0' does not ",
        )

    def yuv442p():
        return run.main(["resources/test_yuv422p.mp4"], [])

    def prores():
        run.main(["resources/testsrc.mp4", "-c:v", "prores", "-o", "out.mkv"], [])
        assert fileinfo("out.mkv").videos[0].pix_fmt == "yuv422p10le"

        run.main(["out.mkv", "-c:v", "prores", "-o", "out2.mkv"], [])
        assert fileinfo("out2.mkv").videos[0].pix_fmt == "yuv422p10le"

        return "out.mkv", "out2.mkv"

    #  Issue 280
    def SAR():
        out = run.main(["resources/SAR-2by3.mp4"], [])
        assert fileinfo(out).videos[0].sar == Fraction(2, 3)

        return out

    def audio_norm_f():
        return run.main(["example.mp4"], ["--audio-normalize", "#f"])

    def audio_norm_ebu():
        return run.main(
            ["example.mp4"], ["--audio-normalize", "ebu:i=-5,lra=20,gain=5,tp=-1"]
        )

    def palet_python_bridge():
        env.update(make_standard_env())

        def cases(*cases: tuple[str, Any]) -> None:
            for text, expected in cases:
                try:
                    parser = Parser(Lexer("repl", text))
                    env["timebase"] = Fraction(30)
                    results = interpret(env, parser)
                except MyError as e:
                    raise ValueError(f"{text}\nMyError: {e}")

                if isinstance(expected, np.ndarray):
                    if not np.array_equal(expected, results[-1]):
                        raise ValueError(f"{text}: Numpy arrays don't match")
                elif expected != results[-1]:
                    raise ValueError(f"{text}: Expected: {expected}, got {results[-1]}")

        cases(
            ("345", 345),
            ("238.5", 238.5),
            ("-34", -34),
            ("-98.3", -98.3),
            ("+3i", 3j),
            ("3sec", 90),
            ("-3sec", -90),
            ("0.2sec", 6),
            ("(+ 4 3)", 7),
            ("(+ 4 3 2)", 9),
            ("(+ 10.5 3)", 13.5),
            ("(+ 3+4i -2-2i)", 1 + 2j),
            ("(+ 3+4i -2-2i 5)", 6 + 2j),
            ("(- 4 3)", 1),
            ("(- 3)", -3),
            ("(- 10.5 3)", 7.5),
            ("(* 11.5 3)", 34.5),
            ("(/ 3/4 4)", Fraction(3, 16)),
            ("(/ 5)", 0.2),
            ("(/ 6 1)", 6.0),
            ("30/1", Fraction(30)),
            ("(sqrt -4)", 2j),
            ("(pow 2 3)", 8),
            ("(pow 4 0.5)", 2.0),
            ("(abs 1.0)", 1.0),
            ("(abs -1)", 1),
            ("(bool? #t)", True),
            ("(bool? #f)", True),
            ("(bool? 0)", False),
            ("(bool? 1)", False),
            ("(bool? false)", True),
            ("(int? 2)", True),
            ("(int? 3.0)", False),
            ("(int? #t)", False),
            ("(int? #f)", False),
            ("(int? 4/5)", False),
            ("(int? 0+2i)", False),
            ('(int? "hello")', False),
            ('(int? "3")', False),
            ("(float? -23.4)", True),
            ("(float? 3.0)", True),
            ("(float? #f)", False),
            ("(float? 4/5)", False),
            ("(float? 21)", False),
            ("(frac? 4/5)", True),
            ("(frac? 3.4)", False),
            ('(& "Hello" " World")', "Hello World"),
            ('(define apple "Red Wood") apple', "Red Wood"),
            ("(= 1 1.0)", True),
            ("(= 1 2)", False),
            ("(= 2+3i 2+3i 2+3i)", True),
            ("(= 1)", True),
            ("(+)", 0),
            ("(*)", 1),
            ('(define num 13) ; Set number to 13\n"Hello"', "Hello"),
            ('(if #t "Hello" apple)', "Hello"),
            ('(if #f mango "Hi")', "Hi"),
            ('{if (= [+ 3 4] 7) "yes" "no"}', "yes"),
            ("((if #t + -) 3 4)", 7),
            ("((if #t + oops) 3+3i 4-2i)", 7 + 1j),
            ("((if #f + -) 3 4)", -1),
            ("(when (positive? 3) 17)", 17),
            ("(string)", ""),
            ("(string #\\a)", "a"),
            ("(string #\\a #\\b)", "ab"),
            ("(string #\\a #\\b #\\c)", "abc"),
            (
                "(margin (bool-array 0 0 0 1 0 0 0) 0)",
                np.array([0, 0, 0, 1, 0, 0, 0], dtype=np.bool_),
            ),
            (
                "(margin (bool-array 0 0 1 1 0 0 0) -2 2)",
                np.array([0, 0, 0, 0, 1, 1, 0], dtype=np.bool_),
            ),
            ("(equal? 3 3)", True),
            ("(equal? 3 3.0)", False),
            ('(equal? 16.3 "Editor")', False),
            ("(equal? (bool-array 1 1 0) (bool-array 1 1 0))", True),
            ("(equal? (bool-array 0 1 0) (bool-array 1 1 0))", False),
            ("(equal? (bool-array 0 1 0) (bool-array 0 1 0 0))", False),
            ("(equal? #\\a #\\a)", True),
            ('(equal? "a" #\\a)', False),
            ("(equal? (vector 1 2 3) (vector 1 2 3))", True),
            (
                "(or (bool-array 1 0 0) (bool-array 0 0 0 1))",
                np.array([1, 0, 0, 1], dtype=np.bool_),
            ),
            ("(len (vector 1 2 4))", 3),
            ("(len #(1 2 4))", 3),
            ("(len (bool-array 0 1 0))", 3),
            ("(equal? (reverse #(0 1 2)) #(2 1 0))", True),
            ("(equal? (reverse (vector 0 1 2)) (vector 2 1 0))", True),
            ('(ref "Zyx" 1)', Char("y")),
            ("(ref (vector 0.3 #\\a 2) 2)", 2),
            ("(ref (range 0 10) 2)", 2),
            ("((range 0 10) 2)", 2),
            ("((vector 0.3 #\\a 17) 2)", 17),
            ("(#(0.3 #\\a 17) 2)", 17),
            ("(begin)", None),
            ("(void)", None),
            ("(begin (define r 10) (* 3.14 (* r r)))", 314.0),
            ("#(-20dB 0dB 20dB)", [0.1, 1, 10]),
            ("(define ca (lambda (r) (* 3.14 (* r r)))) (ca 5)", 78.5),
            (
                "(define ca (lambda (r) (void) (* 3.14 (* r r)))) (ca 5)",
                78.5,
            ),
            ("(define (my-pow2 a) (* a a)) (my-pow2 30)", 900),
            ("(define (my-pow2 a) (void) (* a a)) (my-pow2 30)", 900),
            ("(~a 3 4 'a)", "34a"),
            ("(~s 3 4 'a)", "3 4 a"),
            ("(~v 3 4 'a)", "3 4 'a"),
            ("(define (my-func x) (define (inner) 4) (+ x (inner))) (my-func 16)", 20),
            ("(define (text child ...) child)", None),
            ("(text)", []),
            ("(text 1)", [1]),
            ("(text 2 1)", [2, 1]),
            ("(text 3 2 1)", [3, 2, 1]),
            ("((or/c 0 1) 1)", True),
            ("((or/c 0 1) 2)", False),
            ("((or/c 0 1) 1)", True),
            ('((or/c 0 1 string?) "hello")', True),
            ("((or/c 0 1 string?) 3)", False),
            ('"hello".title', "Hello"),
            ('"hello".upper', "HELLO"),
            ('"heLlo".lower', "hello"),
            ('(define s "hello")s.title', "Hello"),
            ("(define v #(2 0 3 -4 -2 5 1 4)) v.sort", [-4, -2, 0, 1, 2, 3, 4, 5]),
            ("(define v #(2 0 3 -4 -2 5 1 4)) v.sort! v", [-4, -2, 0, 1, 2, 3, 4, 5]),
            ('#(#("sym" "symbol?") "bool?")', [["sym", "symbol?"], "bool?"]),
        )

    def palet_scripts():
        run.raw(["palet", "resources/scripts/scope.pal"])
        run.raw(["palet", "resources/scripts/maxcut.pal"])
        run.raw(["palet", "resources/scripts/case.pal"])
        run.raw(["palet", "resources/scripts/testmath.pal"])

    tests = []

    if args.category in {"palet", "all"}:
        tests.extend([palet_python_bridge, palet_scripts])

    if args.category in {"sub", "all"}:
        tests.extend([info, levels, subdump, desc])

    if args.category in {"cli", "all"}:
        tests.extend(
            [
                premiere,
                SAR,
                yuv442p,
                prores,
                edit_negative_tests,
                edit_positive_tests,
                audio_norm_f,
                audio_norm_ebu,
                export_json_tests,
                import_v1_tests,
                high_speed_test,
                video_speed,
                multi_track_edit,
                concat_mux_tracks,
                concat_multiple_tracks,
                frame_rate,
                help_tests,
                version_test,
                parser_test,
                concat,
                example,
                units,
                sr_units,
                backwards_range,
                cut_out,
                gif,
                margin_tests,
                input_extension,
                output_extension,
                progress,
                silent_threshold,
                track_tests,
                codec_tests,
                premiere_named_export,
                export_subtitles,
                export,
                motion,
                resolution_and_scale,
            ]
        )

    run_tests(tests, args)


if __name__ == "__main__":
    main()
