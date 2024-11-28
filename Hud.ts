import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';


class Hud extends ui.UIComponent<typeof Hud> {
  static propsDefinition = {};

    timerText = new ui.Binding<string>('00:00:00')
    pointsText = new ui.Binding<string>('Points: 100')
    initializeUI() {
        return ui.View({
            children: [
                ui.View({ // top
                    children: [
                        ui.Text({ // timer text
                            text: this.timerText,
                            style: { position: 'absolute', alignSelf: 'center', height: '100%', width: '90%', textAlign: 'center', textAlignVertical: 'center', fontSize: 20, color: 'black', fontFamily: "Bangers" },
                        }),
                        ui.Text({ // points text
                            text: this.timerText,
                            style: { position: 'absolute', alignSelf: 'center', height: '100%', width: '90%', textAlign: 'center', textAlignVertical: 'center', fontSize: 20, color: 'black' },
                        }),
                    ],
                    style: { position: 'absolute', top: 25, left: '25%', height: 10, width: '48%', backgroundColor: 'grey', borderRadius: 25 },
                }),
            ],
            style: { position: 'absolute', height: '100%', width: '100%' },
        })
    }

  start() { }
}
hz.Component.register(Hud);