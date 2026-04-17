import * as React from "react";
import { useAppDispatch } from "../../ducks";
import { selectRules, InterceptRule } from "../../ducks/ui/intercept";
import InterceptRuleEditor from "./InterceptRuleEditor";

export default function InterceptDetail({ rule }: { rule: InterceptRule }) {
    const dispatch = useAppDispatch();

    return (
        <div className="flow-detail">
            <nav className="nav-tabs nav-tabs-sm">
                <button
                    className="close-button"
                    onClick={() => dispatch(selectRules([]))}
                >
                    <i className="fa fa-times-circle"></i>
                </button>
                <a href="#" className="active" onClick={e => e.preventDefault()}>
                    Rule Editor
                </a>
            </nav>
            <section>
                <InterceptRuleEditor rule={rule} />
            </section>
        </div>
    );
}
