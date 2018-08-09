import React from "react";
import { StyleSheet } from "react-native";
import { Font } from "expo";
import {
  Button,
  Container,
  Header,
  Content,
  Title,
  Left,
  Body,
  Right,
  Text,
  Spinner,
  Picker,
  Form,
  Item,
  Card,
  CardItem,
  Subtitle
} from "native-base";
import Icon from "react-native-vector-icons/FontAwesome";
import _ from "underscore";
import moment from "moment";

class BodyView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFontLoading: true,
      isListLoading: true,
      isPickersLoading: true,
      source: [],
      items: [],
      localeSelected: undefined,
      countrySelected: undefined,
      dateRangeSelected: [moment().startOf("week"), moment().endOf("week")]
    };

    this.importanceMap = {
      低: "low",
      中: "medium",
      高: "high"
    };
    this.localeMap = {
      cn: "繁中",
      cnc: "簡中",
      en: "English",
      jp: "日本語"
    };
  }

  async componentWillMount() {
    await Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf")
    });

    this.setState({ isFontLoading: false });
  }

  componentDidMount() {
    this.fetchList();
  }

  fetchList(increment) {
    var dateRange_latest = [moment().startOf("week"), moment().endOf("week")];
    var dateRange_new = increment
      ? this.state.dateRangeSelected.map(v => v.add(increment, "weeks"))
      : dateRange_latest;

    dateRange_new = dateRange_new[0].isAfter(dateRange_latest[0])
      ? dateRange_latest
      : dateRange_new;

    this.setState(
      {
        isListLoading: true,
        isPickersLoading: true,
        dateRangeSelected: dateRange_new
      },
      () => {
        var url =
          "http://marketinfo.easthillfx.co.jp/query.do?date=" +
          this.formatDate(this.state.dateRangeSelected[1]);
        fetch(url)
          .then(response => {
            return response.json();
          })
          .then(jsonData => {
            this.setState({
              isListLoading: false,
              source: jsonData.data,
              items: jsonData.data,
              countrySelected: "all"
            });
          })
          .catch(error => {
            alert(error);
          });
      }
    );
  }

  formatDate(date_moment, format) {
    return (date_moment ? date_moment : moment()).format(
      format ? format : "YYYY-MM-DD"
    );
  }

  sort(items) {
    return _.sortBy(items, item => item.date + item.time).reverse();
  }

  filter(items, locale, country) {
    var items_filtered = _.filter(items, item => item.locale === locale);
    if (country && country !== "all") {
      items_filtered = _.filter(
        items_filtered,
        item => item.country === country
      );
    }
    return this.sort(items_filtered);
  }

  onLocaleValueChange(value) {
    if (value) {
      this.setState({
        localeSelected: value,
        isPickersLoading: true
      });
    }
  }

  onCountryValueChange(value) {
    if (value) {
      this.setState({
        isPickersLoading: false,
        countrySelected: value,
        items: this.filter(this.state.source, this.state.localeSelected, value)
      });
    }
  }

  generateLocalePicker() {
    return ["cn", "cnc", "en", "jp"].map(item => (
      <Picker.Item key={item} label={this.localeMap[item]} value={item} />
    ));
  }

  generateCountryPicker() {
    if (this.state.source.length > 0) {
      return [
        <Picker.Item key="all" label="all" value="all" />,
        ...Object.keys(
          _.groupBy(
            _.filter(
              this.state.source,
              item => item.locale === this.state.localeSelected
            ),
            "country"
          )
        ).map(item => <Picker.Item key={item} label={item} value={item} />)
      ];
    } else {
      return <Picker.Item key="all" label="all" value="all" />;
    }
  }

  render() {
    const {
      items,
      source,
      isListLoading,
      isPickersLoading,
      isFontLoading,
      dateRangeSelected
    } = this.state;
    if (isFontLoading) {
      return (
        <Container>
          <Spinner color="blue" />
        </Container>
      );
    } else {
      return (
        <Container>
          <Header style={styles.header}>
            <Left>
              <Button large transparent onPress={this.fetchList.bind(this, -1)}>
                <Icon color="white" size={50} name="angle-left" />
              </Button>
            </Left>
            <Body>
              <Subtitle>
                {this.formatDate(dateRangeSelected[1], "YYYY")}
              </Subtitle>
              <Title>
                {this.formatDate(dateRangeSelected[0], "MM-DD")} ~{" "}
                {this.formatDate(dateRangeSelected[1], "MM-DD")}
              </Title>
            </Body>
            <Right>
              <Button transparent>
                <Icon
                  color="white"
                  size={50}
                  name="angle-right"
                  onPress={this.fetchList.bind(this, 1)}
                />
              </Button>
              <Button transparent>
                <Icon
                  color="white"
                  size={50}
                  name="angle-double-right"
                  onPress={this.fetchList.bind(this, undefined)}
                />
              </Button>
            </Right>
          </Header>
          <Content>
            <Form>
              <Item picker>
                <Picker
                  mode="dialog"
                  placeholder="Choose Locale"
                  selectedValue={this.state.localeSelected}
                  onValueChange={this.onLocaleValueChange.bind(this)}
                >
                  {isListLoading ? (
                    <Picker.Item label="" value="" />
                  ) : (
                    this.generateLocalePicker()
                  )}
                </Picker>
                <Picker
                  mode="dialog"
                  placeholder="Choose Country"
                  selectedValue={this.state.countrySelected}
                  onValueChange={this.onCountryValueChange.bind(this)}
                >
                  {isListLoading ? (
                    <Picker.Item label="" value="" />
                  ) : (
                    this.generateCountryPicker()
                  )}
                </Picker>
              </Item>
            </Form>
            {isPickersLoading ? (
              source.length > 0 ? (
                <Spinner color="blue" />
              ) : (
                <Body style={{ alignItems: "center" }}>
                  <Text>no events</Text>
                </Body>
              )
            ) : items.length > 0 ? (
              items.map(item => this.renderCard(item))
            ) : (
              <Body style={{ alignItems: "center" }}>
                <Text>no events</Text>
              </Body>
            )}
          </Content>
        </Container>
      );
    }
  }

  removeTags(tag_str) {
    const res = /<span\sstyle='color:(.*?)'>(.*?)<\/[^>]+>/.exec(tag_str);
    return res
      ? { style: { color: res[1] }, text: res[2] }
      : { style: { color: "black" }, text: tag_str };
  }

  renderCard(item) {
    return (
      <Card key={item.id}>
        <CardItem
          bordered
          style={[
            styles[this.importanceMap[item.importance]],
            styles.nobotborder
          ]}
        >
          <Left>
            <Text note>{item.country}</Text>
          </Left>
          <Right>
            <Text>{item.released_date}</Text>
            <Text note>{item.released_time}</Text>
          </Right>
        </CardItem>
        <CardItem
          cardBody
          bordered
          style={[
            styles[this.importanceMap[item.importance]],
            styles.nobotborder,
            styles.notopborder
          ]}
        >
          <Left>
            <Text style={this.removeTags(item.event).style}>
              {this.removeTags(item.event).text}
            </Text>
          </Left>
        </CardItem>
        <CardItem
          bordered
          style={[
            styles[this.importanceMap[item.importance]],
            styles.notopborder
          ]}
        >
          <Body>
            {item.forecast ? (
              <Text note style={this.removeTags(item.forecast).style}>
                forecast: {this.removeTags(item.forecast).text}
              </Text>
            ) : (
              <Text />
            )}
            {item.previous ? (
              <Text note style={this.removeTags(item.previous).style}>
                previous: {this.removeTags(item.previous).text}
              </Text>
            ) : (
              <Text />
            )}
            {item.actual ? (
              <Text note style={this.removeTags(item.actual).style}>
                actual: {this.removeTags(item.actual).text}
              </Text>
            ) : (
              <Text />
            )}
          </Body>
        </CardItem>
      </Card>
    );
  }
}

const styles = StyleSheet.create({
  low: {
    borderColor: "#17a2b8",
    borderWidth: 1
  },
  medium: {
    borderColor: "#ffc107",
    borderWidth: 1
  },
  high: {
    borderColor: "#dc3545",
    borderWidth: 1
  },
  nobotborder: {
    borderBottomWidth: 0
  },
  notopborder: {
    borderTopWidth: 0
  },
  header: {
    height: 80
  }
});

export default BodyView;
