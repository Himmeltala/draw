import { RandomConfig } from "../types";

export class Extract {
  private xlsx: any;
  private config: RandomConfig;

  constructor(xlsx: any, config: RandomConfig) {
    this.xlsx = xlsx;
    this.config = config;
  }

  private distinct(rans: any[]) {
    rans.sort((a, b) => a - b);
    function loop(index: number) {
      if (index >= 1) {
        if (rans[index] === rans[index - 1]) rans.splice(index, 1);
        loop(index - 1);
      }
    }
    loop(rans.length - 1);
    return rans;
  }

  private produce(rans: number[]) {
    for (let i = 0; i < this.config.max; i++) {
      rans[i] = Math.floor(Math.random() * this.xlsx.length);
      if (this.xlsx[rans[i]]?.标签 == true) rans[i] = NaN;
    }
    rans = this.distinct(rans);
    if (!rans) this.produce(rans);
    else {
      if (rans.length < this.config.max) this.produce(rans);
      else {
        rans.forEach(value => {
          if (!value) this.produce(rans);
        });
      }
    }
    // console.log(rans);
  }

  public random(): any {
    let rans: number[] = [];
    this.produce(rans);
    return rans;
  }
}
